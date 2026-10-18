// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackLinkClick } from "../analytics";
import { Blocks } from "./Blocks";

vi.mock("../analytics", () => ({
  trackLinkClick: vi.fn(),
}));

// Observe React's cancellation before suppressing jsdom's unsupported navigation.
function clickWithoutNavigating(link: HTMLElement, init: MouseEventInit = {}) {
  let handled = false;
  document.addEventListener("click", (event) => {
    handled = event.defaultPrevented;
    event.preventDefault();
  }, { once: true });
  link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
  return handled;
}

describe("content links and source notes", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(trackLinkClick).mockClear();
  });

  it("renders a dated authoritative source as an external link", () => {
    render(<Blocks blocks={[{
      tag: "SOURCE",
      text: "New Jersey Municipalities",
      href: "https://www.nj.gov/infobank/revmuni.htm",
      accessed: "2026-07-18",
    }]} />);

    const link = screen.getByRole("link", { name: "New Jersey Municipalities" });
    expect(link).toHaveAttribute("href", "https://www.nj.gov/infobank/revmuni.htm");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Accessed 2026-07-18.")).toBeVisible();

    link.click();
    expect(trackLinkClick).toHaveBeenCalledWith(
      "https://www.nj.gov/infobank/revmuni.htm",
      "New Jersey Municipalities",
      "community_source",
    );
  });

  it("does not turn a non-HTTPS draft source into a clickable link", () => {
    render(<Blocks blocks={[{
      tag: "SOURCE",
      text: "Incomplete draft source",
      href: "http://example.com",
      accessed: "2026-07-18",
    }]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Incomplete draft source")).toBeVisible();
  });

  it("opens an external content button safely and tracks its destination", () => {
    render(<Blocks blocks={[{
      tag: "A",
      text: "Visit HomeBase CRM",
      href: "https://homebasecrm.com",
    }]} />);

    const link = screen.getByRole("link", { name: "Visit HomeBase CRM" });
    expect(link).toHaveAttribute("href", "https://homebasecrm.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");

    link.click();
    expect(trackLinkClick).toHaveBeenCalledWith(
      "https://homebasecrm.com",
      "Visit HomeBase CRM",
      "content_button",
    );
  });

  it("handles an ordinary internal CTA through the supplied navigator", () => {
    const navigate = vi.fn();
    render(<Blocks blocks={[{ tag: "A", text: "Ask about a property", href: "/contact" }]} navigate={navigate} />);

    expect(clickWithoutNavigating(screen.getByRole("link", { name: "Ask about a property" }))).toBe(true);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/contact");
    expect(trackLinkClick).toHaveBeenCalledExactlyOnceWith("/contact", "Ask about a property", "content_button");
  });

  it("keeps modified inline and CTA clicks native while preserving existing click tracking", () => {
    const navigate = vi.fn();
    render(<Blocks blocks={[
      { tag: "P", text: "Explore Camden County." },
      { tag: "A", text: "Ask about a property", href: "/contact" },
    ]} navigate={navigate} />);

    expect(clickWithoutNavigating(screen.getByRole("link", { name: "Camden County" }), { metaKey: true })).toBe(false);
    expect(clickWithoutNavigating(screen.getByRole("link", { name: "Ask about a property" }), { ctrlKey: true })).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(vi.mocked(trackLinkClick).mock.calls).toEqual([
      ["/camden-county", "Camden County", "content"],
      ["/contact", "Ask about a property", "content_button"],
    ]);
  });

  it("keeps an internal CTA usable when no SPA navigator is supplied", () => {
    render(<Blocks blocks={[{ tag: "A", text: "Ask about a property", href: "/contact" }]} />);

    expect(clickWithoutNavigating(screen.getByRole("link", { name: "Ask about a property" }))).toBe(false);
    expect(trackLinkClick).toHaveBeenCalledExactlyOnceWith("/contact", "Ask about a property", "content_button");
  });
});
