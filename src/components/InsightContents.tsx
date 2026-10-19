import { useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent } from "react";
import { shouldHandleInternalNavigation } from "../internalNavigation";
import { isHistoryScrollRestoration } from "../scrollRestoration";

type ContentsEntry = { id: string; heading: string };

export function InsightContents({ entries }: { entries: ContentsEntry[] }) {
  const navigation = useRef<HTMLElement>(null);
  const dropdown = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const measureOffsets = useRef<(() => void) | null>(null);
  const frame = useRef<number>(0);
  const anchorKey = entries.map((entry) => entry.id).join("\n");

  useLayoutEffect(() => {
    const nav = navigation.current;
    const layout = nav?.closest<HTMLElement>(".insight-article-layout");
    if (!nav || !layout) return;
    const header = document.querySelector<HTMLElement>(".site-header");
    const details = dropdown.current;
    let measurementFrame = 0;
    const updateOffsets = () => {
      const headerHeight = header?.getBoundingClientRect().height || 0;
      const contentsBounds = nav.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const menuSpace = Math.max(0, viewportBottom - contentsBounds.bottom - 12);
      layout.style.setProperty("--insight-header-height", `${headerHeight}px`);
      layout.style.setProperty("--insight-contents-height", `${contentsBounds.height}px`);
      layout.style.setProperty("--insight-contents-menu-space", `${menuSpace}px`);
    };
    measureOffsets.current = updateOffsets;
    const updateOpenMenu = () => {
      if (!details?.open || measurementFrame) return;
      measurementFrame = window.requestAnimationFrame(() => {
        measurementFrame = 0;
        updateOffsets();
      });
    };
    updateOffsets();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOffsets) : undefined;
    if (header) observer?.observe(header);
    observer?.observe(nav);
    details?.addEventListener("toggle", updateOffsets);
    window.addEventListener("resize", updateOffsets);
    window.addEventListener("scroll", updateOpenMenu, { passive: true });
    window.visualViewport?.addEventListener("resize", updateOffsets);
    return () => {
      measureOffsets.current = null;
      observer?.disconnect();
      details?.removeEventListener("toggle", updateOffsets);
      window.removeEventListener("resize", updateOffsets);
      window.removeEventListener("scroll", updateOpenMenu);
      window.visualViewport?.removeEventListener("resize", updateOffsets);
      window.cancelAnimationFrame(measurementFrame);
    };
  }, []);

  const focusSection = useCallback((id: string) => {
    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      const section = document.getElementById(id);
      if (!isHistoryScrollRestoration()) section?.scrollIntoView({ block: "start", behavior: "instant" });
      section?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (dropdown.current) dropdown.current.open = false;
    const knownAnchors = new Set(anchorKey.split("\n"));
    const syncHash = () => {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      if (knownAnchors.has(id)) focusSection(id);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.cancelAnimationFrame(frame.current);
    };
  }, [anchorKey, focusSection]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (dropdown.current?.open && event.target instanceof Node && !dropdown.current.contains(event.target)) {
        dropdown.current.open = false;
      }
    };
    const mobile = window.matchMedia("(max-width: 760px)");
    const closeOnResize = () => {
      const active = document.activeElement;
      const hadContentsFocus = active instanceof HTMLElement && navigation.current?.contains(active);
      const href = active?.closest("a")?.getAttribute("href");
      if (dropdown.current) dropdown.current.open = false;
      if (hadContentsFocus) {
        const desktopLinks = navigation.current?.querySelectorAll<HTMLAnchorElement>(".insight-contents-desktop a");
        const desktopTarget = Array.from(desktopLinks || []).find((link) => link.getAttribute("href") === href)
          || desktopLinks?.[0];
        (mobile.matches ? summary.current : desktopTarget)?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    mobile.addEventListener("change", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      mobile.removeEventListener("change", closeOnResize);
    };
  }, []);

  const selectSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!shouldHandleInternalNavigation(event)) return;
    if (dropdown.current) dropdown.current.open = false;
    focusSection(id);
  };
  const links = entries.map((entry) => (
    <li key={entry.id}>
      <a href={`#${entry.id}`} onClick={(event) => selectSection(event, entry.id)}>{entry.heading}</a>
    </li>
  ));

  return (
    <nav className="insight-table-of-contents" aria-label="On this page" ref={navigation}>
      <div className="insight-contents-desktop">
        <p>On this page</p>
        <ol>{links}</ol>
      </div>
      <details
        className="insight-contents-dropdown"
        ref={dropdown}
        onKeyDown={(event) => {
          if (event.key === "Escape" && dropdown.current?.open) {
            event.preventDefault();
            event.stopPropagation();
            dropdown.current.open = false;
            summary.current?.focus();
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        }}
      >
        <summary ref={summary} onClick={() => measureOffsets.current?.()}>On this page</summary>
        <ol>{links}</ol>
      </details>
    </nav>
  );
}
