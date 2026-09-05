// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { managedPageSeeds } from "../content/siteEditor";
import AdminPage from "./AdminPage";

vi.mock("./supabase", () => ({
  isAdminSupabaseConfigured: true,
  getAdminRedirectUrl: () => "http://localhost/admin",
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "fixture-admin" } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    rpc: async () => ({ data: true, error: null }),
  },
}));

vi.mock("./siteContentStore", async () => {
  const { managedContentKeys, seedContentRecord } = await import("../content/siteEditor");
  return { loadAdminSiteContent: async () => managedContentKeys.map(seedContentRecord) };
});

vi.mock("./PageDocumentEditor", () => ({
  PageDocumentEditor: ({ record }: { record: { pageKey: string } }) => (
    <p data-testid="selected-document">{record.pageKey}</p>
  ),
}));

vi.mock("./ContactInquiryManager", () => ({ ContactInquiryManager: () => null }));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("administrator article navigation", () => {
  it("opens every managed Insights article in the editor", async () => {
    const user = userEvent.setup();
    render(<AdminPage />);
    const navigation = await screen.findByRole("navigation", { name: "Website editor sections" });
    const articles = managedPageSeeds.filter((document) => document.insightArticle);

    expect(articles).toHaveLength(8);
    for (const article of articles) {
      await user.click(within(navigation).getByRole("button", { name: article.insightArticle!.title }));
      expect(screen.getByTestId("selected-document")).toHaveTextContent(article.page.path);
    }
  });
});
