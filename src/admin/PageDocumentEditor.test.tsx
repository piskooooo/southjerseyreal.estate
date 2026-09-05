// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  managedContentSeeds,
  seedContentRecord,
  type ManagedContentRecord,
} from "../content/siteEditor";
import { PageDocumentEditor } from "./PageDocumentEditor";

const pageKey = "/about";
const seed = structuredClone(managedContentSeeds.get(pageKey)!);
const record: ManagedContentRecord = {
  pageKey,
  draft: seed,
  savedDraft: structuredClone(seed),
  published: structuredClone(seed),
  publishedAt: "2026-07-18T00:00:00Z",
  updatedAt: "2026-07-18T00:00:00Z",
  exists: true,
};

function EditorHarness({ initialRecord = record }: { initialRecord?: ManagedContentRecord }) {
  const [records, setRecords] = useState([initialRecord]);
  return (
    <PageDocumentEditor
      record={records[0]}
      onChange={setRecords}
      setNotice={vi.fn()}
      onBusyChange={vi.fn()}
    />
  );
}

afterEach(cleanup);

describe("navigation destinations", () => {
  it("lets the owner set the destination of an added navigation link", async () => {
    const user = userEvent.setup();
    render(<EditorHarness initialRecord={seedContentRecord("__sitewide__")} />);
    const countyLinks = screen.getByRole("heading", { name: "County Links" }).closest("section")!;
    await user.click(within(countyLinks).getByRole("button", { name: "Add" }));
    const destinations = within(countyLinks).getAllByLabelText("Destination");
    const addedDestination = destinations.at(-1)!;

    expect(destinations).toHaveLength(8);
    await user.type(addedDestination, "/insights");
    expect(addedDestination).toHaveValue("/insights");
  });

  it("keeps the page identity and index migration marker out of the editor", () => {
    const { container } = render(<EditorHarness initialRecord={seedContentRecord("/insights")} />);
    expect(container.querySelector("#site-content-page-path")).toBeNull();
    expect(container.querySelector("#site-content-insightIndexVersion")).toBeNull();
  });
});

describe("page document source controls", () => {
  it("adds a complete dated source block to a content section", { timeout: 10_000 }, async () => {
    const user = userEvent.setup();
    render(<EditorHarness />);

    expect(screen.queryByLabelText("Accessed")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add source" })[0]);

    expect(screen.getByDisplayValue("https://")).toBeVisible();
    expect((screen.getByLabelText("Accessed") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
