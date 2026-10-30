// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactInquiryManager, safeSourceUrl } from "./ContactInquiryManager";
vi.mock("./contactInquiryStore", () => ({ loadContactInquiries: async () => [
  { id: "test", name: "Test", email: "", phone: "", interest: "Selling", message: "Test", sourcePath: "/", sourceOrigin: "https://arthurpisko.realtor", notificationStatus: "sent", createdAt: "2026-10-30", expiresAt: "" },
  { id: "old", name: "Old test", email: "", phone: "", interest: "", message: "Test", sourcePath: "/contact", sourceOrigin: "", notificationStatus: "pending", createdAt: "2026-10-29", expiresAt: "" },
] }));
describe("contact source and notification evidence", () => {
  it.each(["//evil.example", "/\\evil.example", "javascript:alert(1)"])("does not link unsafe source %s", path => {
    expect(safeSourceUrl(path, "https://arthurpisko.realtor")).toBe("");
  });
  it("does not link an unapproved origin", () => {
    expect(safeSourceUrl("/", "https://evil.example")).toBe("");
  });
  it("links to the recorded site and distinguishes provider acceptance from receipt", async () => {
    render(<ContactInquiryManager />);
    const link = await screen.findByRole("link", { name: "https://arthurpisko.realtor/" });
    expect(link.getAttribute("href")).toBe("https://arthurpisko.realtor/");
    expect(screen.getByText(/Accepted by email provider/)).toBeTruthy();
    expect(screen.getByText(/Website not recorded/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "/contact" })).toBeNull();
  });
});
