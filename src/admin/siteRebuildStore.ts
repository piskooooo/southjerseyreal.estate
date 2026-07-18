import { supabase } from "./supabase";

export async function requestSiteRebuild() {
  if (!supabase) return { queued: false, local: true };
  const { data, error } = await supabase.functions.invoke("site-rebuild", {
    body: { reason: "published-content-changed" },
  });
  if (error) {
    throw new Error("Changes are live, but the SEO rebuild could not be queued. The next deployment will refresh crawler metadata.");
  }
  return data || { queued: true };
}
