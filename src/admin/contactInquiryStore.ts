import { supabase } from "./supabase";

export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  sourcePath: string;
  sourceOrigin: string;
  outcome: string;
  notificationStatus: string;
  createdAt: string;
  expiresAt: string;
};

export type ContactInquiryCursor = Pick<ContactInquiry, "createdAt" | "id">;

export async function loadContactInquiries({
  limit = 50,
  before,
}: { limit?: number; before?: ContactInquiryCursor | null } = {}): Promise<ContactInquiry[]> {
  if (!supabase) throw new Error("The private contact inbox is not connected to Supabase yet.");
  const { data, error } = await supabase.rpc("list_contact_inquiries", {
    p_limit: Math.min(100, Math.max(1, limit)),
    p_before_created_at: before?.createdAt || null,
    p_before_id: before?.id || null,
  });
  if (error) throw new Error(`Unable to load contact inquiries: ${error.message}`);
  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.inquiry_id || ""),
    name: String(row.inquiry_name || ""),
    email: String(row.inquiry_email || ""),
    phone: String(row.inquiry_phone || ""),
    interest: String(row.inquiry_interest || ""),
    message: String(row.inquiry_message || ""),
    sourcePath: String(row.inquiry_source_path || ""),
    sourceOrigin: String(row.inquiry_source_origin || ""),
    outcome: String(row.inquiry_outcome || "unreviewed"),
    notificationStatus: String(row.inquiry_notification_status || "pending"),
    createdAt: String(row.inquiry_created_at || ""),
    expiresAt: String(row.inquiry_expires_at || ""),
  }));
}

export async function saveContactOutcome(id: string, outcome: string): Promise<void> {
  if (!supabase) throw new Error("The private contact inbox is not connected.");
  const { data, error } = await supabase.rpc("set_contact_inquiry_outcome", {
    p_inquiry_id: id, p_outcome: outcome,
  });
  if (error || data !== true) throw new Error("Unable to save the outcome. Refresh and try again.");
}
