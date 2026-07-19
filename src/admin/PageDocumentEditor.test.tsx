// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  managedContentSeeds,
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

function EditorHarness() {
  const [records, setRecords] = useState([record]);
  return (
    <PageDocumentEditor
      record={records[0]}
      onChange={setRecords}
      setNotice={vi.fn()}
      onBusyChange={vi.fn()}
    />
  );
}

describe("page document source controls", () => {
  it("adds a complete dated source block to a content section", async () => {
    const user = userEvent.setup();
    render(<EditorHarness />);

    expect(screen.queryByLabelText("Accessed")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add source" })[0]);

    expect(screen.getByDisplayValue("https://")).toBeVisible();
    expect((screen.getByLabelText("Accessed") as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
