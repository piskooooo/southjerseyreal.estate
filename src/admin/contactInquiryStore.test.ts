import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabase", () => ({
  supabase: { rpc },
}));

import { loadContactInquiries } from "./contactInquiryStore";

describe("contact inquiry pagination", () => {
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
