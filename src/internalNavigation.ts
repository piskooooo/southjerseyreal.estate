import type { MouseEvent } from "react";

export function shouldHandleInternalNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  const link = event.currentTarget;
  const target = link.getAttribute("target")?.toLowerCase();

  return !event.defaultPrevented
    && event.button === 0
    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
    && (!target || target === "_self")
    && !link.hasAttribute("download")
    && !link.getAttribute("href")?.startsWith("//");
}
