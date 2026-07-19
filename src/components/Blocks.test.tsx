// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackLinkClick } from "../analytics";
import { Blocks } from "./Blocks";

vi.mock("../analytics", () => ({
  trackLinkClick: vi.fn(),
}));

describe("content source notes", () => {
  afterEach(cleanup);

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
});
