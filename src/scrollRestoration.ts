import { useLayoutEffect, useRef, useState } from "react";
import { normalizeRoutePath } from "./content/seo";

const ENTRY_KEY = "sjreScrollEntry";
type Position = { x: number; y: number };
type PendingPosition = Position & { key: string; path: string };
type ScrollController = ReturnType<typeof createScrollController>;
let activeController: ScrollController | null = null;

// Only the entry identifier goes into history; reading positions stay in memory.
const newEntryKey = () => window.crypto.randomUUID();

function createScrollController(onTraversal: () => void) {
  const positions = new Map<string, Position>();
  const townExpansions = new Map<string, { countyPath: string; keys: string[] }>();
  const openPanels = new Map<string, string[]>();
  const previousRestoration = window.history.scrollRestoration;
  let currentKey = window.history.state?.[ENTRY_KEY];
  if (typeof currentKey !== "string") {
    currentKey = newEntryKey();
    window.history.replaceState({ ...window.history.state, [ENTRY_KEY]: currentKey }, "");
  }
  let pending: PendingPosition | null = null;
  let traversing = false;
  let frame = 0;
  window.history.scrollRestoration = "manual";

  const remember = () => {
    if (!pending) positions.set(currentKey, { x: window.scrollX, y: window.scrollY });
  };
  const rememberPanels = () => {
    if (pending) return;
    const panels = document.querySelectorAll<HTMLDetailsElement>("#page details[data-scroll-panel]");
    if (panels.length) openPanels.set(currentKey, Array.from(panels)
      .filter((panel) => panel.open).map((panel) => panel.dataset.scrollPanel!));
  };
  const cancelFrame = () => window.cancelAnimationFrame(frame);
  const userTakesOver = () => {
    cancelFrame();
    pending = null;
    traversing = false;
  };
  const traverse = () => {
    let key = window.history.state?.[ENTRY_KEY];
    if (key === currentKey) return; // Includes the router's synthetic same-page event.
    const saved = typeof key === "string" ? positions.get(key) : undefined;
    // A fresh native fragment can already have scrolled before popstate fires.
    // Its outgoing entry was recorded by the click listener and scroll events.
    if (saved) {
      remember();
      rememberPanels();
    }
    cancelFrame();
    if (typeof key !== "string") {
      key = newEntryKey();
      window.history.replaceState({ ...window.history.state, [ENTRY_KEY]: key }, "");
    }
    currentKey = key;
    traversing = Boolean(saved);
    pending = saved ? { ...saved, key, path: normalizeRoutePath(window.location.pathname) } : null;
    onTraversal();
  };
  const beforeLink = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    userTakesOver(); // Also covers click-only activation by assistive technology.
    remember();
    rememberPanels();
  };
  remember();
  window.addEventListener("scroll", remember, { passive: true });
  window.addEventListener("popstate", traverse, true);
  window.addEventListener("hashchange", traverse, true);
  window.addEventListener("pagehide", remember);
  document.addEventListener("click", beforeLink, true);
  window.addEventListener("wheel", userTakesOver, { passive: true });
  window.addEventListener("touchstart", userTakesOver, { passive: true });
  window.addEventListener("pointerdown", userTakesOver);
  window.addEventListener("keydown", userTakesOver);

  return {
    isTraversal: () => traversing,
    expandedTowns(countyPath: string) {
      const saved = traversing ? townExpansions.get(currentKey) : undefined;
      return saved?.countyPath === countyPath ? saved.keys : undefined;
    },
    rememberExpandedTowns(countyPath: string, keys: Iterable<string>) {
      townExpansions.set(currentKey, { countyPath, keys: [...keys] });
    },
    push(url: string) {
      remember();
      rememberPanels();
      const key = newEntryKey();
      window.history.pushState({ [ENTRY_KEY]: key }, "", url);
      userTakesOver();
      currentKey = key;
      positions.set(key, { x: 0, y: 0 });
    },
    restore(path: string, contentReady: boolean) {
      cancelFrame();
      if (!pending || pending.path !== path || !contentReady) return;
      const target = pending;
      const panels = openPanels.get(target.key);
      if (panels) {
        const expanded = new Set(panels);
        document.querySelectorAll<HTMLDetailsElement>("#page details[data-scroll-panel]")
          .forEach((panel) => { panel.open = expanded.has(panel.dataset.scrollPanel!); });
      }
      // Let the accepted content and town/section expansion commit first.
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => {
          if (pending !== target || currentKey !== target.key) return;
          window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });
          pending = null;
          remember();
        });
      });
    },
    destroy() {
      cancelFrame();
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("scroll", remember);
      window.removeEventListener("popstate", traverse, true);
      window.removeEventListener("hashchange", traverse, true);
      window.removeEventListener("pagehide", remember);
      document.removeEventListener("click", beforeLink, true);
      window.removeEventListener("wheel", userTakesOver);
      window.removeEventListener("touchstart", userTakesOver);
      window.removeEventListener("pointerdown", userTakesOver);
      window.removeEventListener("keydown", userTakesOver);
    },
  };
}

export function pushHistoryEntry(url: string) {
  if (activeController) activeController.push(url);
  else window.history.pushState({}, "", url);
}

export const isHistoryScrollRestoration = () => activeController?.isTraversal() ?? false;

export const restoredTownExpansions = (countyPath: string) => activeController?.expandedTowns(countyPath);
export const rememberTownExpansions = (countyPath: string, keys: Iterable<string>) => {
  activeController?.rememberExpandedTowns(countyPath, keys);
};

export function usePageScrollRestoration(path: string, contentReady: boolean) {
  const controller = useRef<ScrollController | null>(null);
  const [entry, setEntry] = useState(0);
  useLayoutEffect(() => {
    const instance = createScrollController(() => setEntry((value) => value + 1));
    controller.current = instance;
    activeController = instance;
    return () => {
      instance.destroy();
      if (activeController === instance) activeController = null;
      controller.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    controller.current?.restore(path, contentReady);
  }, [path, contentReady, entry]);
}
