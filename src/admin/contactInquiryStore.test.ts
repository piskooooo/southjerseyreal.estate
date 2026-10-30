import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabase", () => ({
  supabase: { rpc },
}));

import { loadContactInquiries, saveContactOutcome } from "./contactInquiryStore";

describe("contact inquiry pagination", () => {
  it("saves an explicit business outcome without sending a notification", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await saveContactOutcome("test-id", "qualified");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("set_contact_inquiry_outcome", { p_inquiry_id: "test-id", p_outcome: "qualified" });
  });
  it("does not report a missing record as saved", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(saveContactOutcome("missing", "qualified")).rejects.toThrow();
  });
  it("retains the recorded origin and leaves historical origins unknown", async () => {
    rpc.mockResolvedValue({ data: [{ inquiry_source_origin: "https://arthurpisko.realtor" }, {}], error: null });
    const rows = await loadContactInquiries();
    expect(rows.map(row => row.sourceOrigin)).toEqual(["https://arthurpisko.realtor", ""]);
  });
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it("sends both parts of the stable database cursor", async () => {
    await loadContactInquiries({
      limit: 150,
      before: {
        createdAt: "2026-07-17T18:30:00.000Z",
        id: "72000000-0000-4000-8000-000000000002",
      },
    });

    expect(rpc).toHaveBeenCalledWith("list_contact_inquiries", {
      p_limit: 100,
      p_before_created_at: "2026-07-17T18:30:00.000Z",
      p_before_id: "72000000-0000-4000-8000-000000000002",
    });
  });

  it("uses a null composite cursor for the first page", async () => {
    await loadContactInquiries({ limit: 50 });

    expect(rpc).toHaveBeenCalledWith("list_contact_inquiries", {
      p_limit: 50,
      p_before_created_at: null,
      p_before_id: null,
    });
  });
});
