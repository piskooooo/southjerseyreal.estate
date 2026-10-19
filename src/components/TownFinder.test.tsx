// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TownFinder } from "./TownFinder";

const entries = [{
  key: "merchantville",
  name: "Merchantville",
  county: "Camden County",
  href: "/camden-county#merchantville",
}];
const navigate = vi.fn();
const searchbox = () => screen.getByRole("searchbox", { name: "Find a town" });

describe("town finder search history", () => {
  beforeEach(() => window.history.replaceState({}, "", "/counties"));
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("keeps the URL, history length, and unrelated state when editing or clearing a search", async () => {
    window.history.replaceState({ unrelated: { value: "retained" } }, "", "/counties?utm_source=fixture#directory");
    const location = window.location.href;
    const length = window.history.length;
    const user = userEvent.setup();
    render(<TownFinder entries={entries} ready navigate={navigate} />);

    await user.type(searchbox(), "Merchantville");
    expect(window.history.state).toEqual({ unrelated: { value: "retained" }, sjreTownFinderQuery: "Merchantville" });
    expect(window.location.href).toBe(location);
    expect(window.history.length).toBe(length);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(searchbox()).toHaveFocus();
    expect(window.history.state).toEqual({ unrelated: { value: "retained" }, sjreTownFinderQuery: "" });
    expect(window.location.href).toBe(location);
    expect(window.history.length).toBe(length);
  });

  it("restores the query while deriving results from accepted current content", () => {
    window.history.replaceState({ sjreTownFinderQuery: "Merchantville" }, "");
    const { rerender } = render(<TownFinder entries={entries} ready={false} navigate={navigate} />);
    expect(searchbox()).toHaveValue("Merchantville");
    expect(searchbox()).toBeDisabled();
    expect(screen.queryByRole("list", { name: "Matching towns" })).not.toBeInTheDocument();

    rerender(<TownFinder entries={entries} ready navigate={navigate} />);
    expect(screen.getByRole("link", { name: /Merchantville\s*Camden County/ })).toHaveAttribute("href", entries[0].href);
    rerender(<TownFinder entries={[]} ready navigate={navigate} />);
    expect(searchbox()).toHaveValue("Merchantville");
    expect(screen.queryByRole("list", { name: "Matching towns" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No towns found.");
  });

  it("reads current history on same-page traversal without writing back or accepting malformed queries", () => {
    render(<TownFinder entries={entries} ready navigate={navigate} />);
    window.history.replaceState({ sjreTownFinderQuery: "Merchantville" }, "");
    const write = vi.spyOn(window.history, "replaceState");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(searchbox()).toHaveValue("Merchantville");
    expect(write).not.toHaveBeenCalled();

    write.mockRestore();
    window.history.replaceState({ sjreTownFinderQuery: { invalid: true } }, "");
    act(() => window.dispatchEvent(new PopStateEvent("popstate")));
    expect(searchbox()).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Matching towns" })).not.toBeInTheDocument();
  });

  it.each(["reading", "writing"] as const)("keeps search and keyboard clearing usable when %s history fails", async (operation) => {
    if (operation === "reading") {
      vi.spyOn(window.history, "state", "get").mockImplementation(() => { throw new Error("History unavailable"); });
    } else {
      vi.spyOn(window.history, "replaceState").mockImplementation(() => { throw new DOMException("History unavailable", "SecurityError"); });
    }
    const user = userEvent.setup();
    render(<TownFinder entries={entries} ready navigate={navigate} />);
    await user.type(searchbox(), "Merchantville");
    expect(screen.getByRole("link", { name: /Merchantville\s*Camden County/ })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(searchbox()).toHaveValue("");
    expect(searchbox()).toHaveFocus();
  });
});
