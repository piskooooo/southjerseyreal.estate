// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { shouldHandleInternalNavigation } from "./internalNavigation";

type NavigationClick = Parameters<typeof shouldHandleInternalNavigation>[0];

function link(attributes: Record<string, string> = {}): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = "/camden-county#audubon";
  for (const [name, value] of Object.entries(attributes)) anchor.setAttribute(name, value);
  return anchor;
}

function click(anchor: HTMLAnchorElement, init: MouseEventInit = {}, prevented = false): NavigationClick {
  const event = new MouseEvent("click", { cancelable: true, ...init });
  if (prevented) event.preventDefault();
  return {
    currentTarget: anchor,
    defaultPrevented: event.defaultPrevented,
    button: event.button,
    detail: event.detail,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
  } as NavigationClick;
}

describe("internal navigation click intent", () => {
  it.each([
    ["ordinary primary", 1],
    ["keyboard-generated", 0],
  ] as const)("handles an unmodified %s click", (_name, detail) => {
    expect(shouldHandleInternalNavigation(click(link(), { button: 0, detail }))).toBe(true);
  });

  it.each(["metaKey", "ctrlKey", "shiftKey", "altKey"] as const)(
    "preserves native behavior when %s is pressed",
    (modifier) => {
      expect(shouldHandleInternalNavigation(click(link(), { [modifier]: true }))).toBe(false);
    },
  );

  it.each([1, 2])("preserves native behavior for mouse button %s", (button) => {
    expect(shouldHandleInternalNavigation(click(link(), { button }))).toBe(false);
  });

  it("respects an event already prevented by another handler", () => {
    expect(shouldHandleInternalNavigation(click(link(), {}, true))).toBe(false);
  });

  it.each([null, "", "_self", "_SELF"])("handles a link with target %j", (target) => {
    expect(shouldHandleInternalNavigation(click(link(target === null ? {} : { target })))).toBe(true);
  });

  it.each(["_blank", "_parent", "_top", "town-guide"])(
    "preserves the link's %s browsing target",
    (target) => {
      expect(shouldHandleInternalNavigation(click(link({ target })))).toBe(false);
    },
  );

  it.each(["", "town-guide.html"])("preserves a download attribute with value %j", (download) => {
    expect(shouldHandleInternalNavigation(click(link({ download })))).toBe(false);
  });

  it("preserves a protocol-relative destination", () => {
    expect(shouldHandleInternalNavigation(click(link({ href: "//example.com/town-guide" })))).toBe(false);
  });
});
