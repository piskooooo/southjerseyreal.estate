import {
  contentRecordFromRow,
  managedContentKeys,
  managedContentSeeds,
  normalizeManagedContent,
  seedContentRecord,
  type ManagedContent,
  type ManagedContentRecord,
} from "../content/siteEditor";
import { IMAGE_ACCEPT, removeStorageImages, safePathSegment, uploadImage } from "./imageStore";
import { supabase } from "./supabase";

const SITE_IMAGE_BUCKET = "site-images";
export const SITE_CONTENT_IMAGE_ACCEPT = IMAGE_ACCEPT;

function requireSupabase() {
  if (!supabase) throw new Error("The website editor is not connected to Supabase yet.");
  return supabase;
}

function requirePageKey(pageKey: string) {
  if (!managedContentSeeds.has(pageKey)) throw new Error("This website page is not editable.");
  return pageKey;
}

export async function loadAdminSiteContent(): Promise<ManagedContentRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("site_pages")
    .select("page_key,draft_content,published_content,published_at,updated_at");
  if (error) throw new Error(`Unable to load website content: ${error.message}`);
  const byKey = new Map(
    (data || [])
      .filter((row) => managedContentSeeds.has(String(row.page_key || "")))
      .map((row) => {
      const record = contentRecordFromRow(row);
      return [record.pageKey, record] as const;
      }),
  );
  return managedContentKeys.map((pageKey) => byKey.get(pageKey) || seedContentRecord(pageKey));
}

export async function saveSiteDraft(
  pageKey: string,
  draft: ManagedContent,
  updatedAt: string,
  exists: boolean,
) {
  const client = requireSupabase();
  const normalizedKey = requirePageKey(pageKey);
  const normalizedDraft = normalizeManagedContent(normalizedKey, draft);

  if (!exists) {
    const { data, error } = await client
      .from("site_pages")
      .insert({
        page_key: normalizedKey,
        draft_content: normalizedDraft,
        published_content: managedContentSeeds.get(normalizedKey),
      })
      .select("page_key,draft_content,published_content,published_at,updated_at")
      .single();
    if (error) throw new Error(`Unable to save this draft: ${error.message}`);
    return contentRecordFromRow(data);
  }

  let query = client
    .from("site_pages")
    .update({ draft_content: normalizedDraft })
    .eq("page_key", normalizedKey);
  if (updatedAt) query = query.eq("updated_at", updatedAt);
  const { data, error } = await query
    .select("page_key,draft_content,published_content,published_at,updated_at")
    .maybeSingle();
  if (error) throw new Error(`Unable to save this draft: ${error.message}`);
  if (!data) {
    throw new Error("This page changed in another editor. Refresh before saving so newer changes are not overwritten.");
  }
  return contentRecordFromRow(data);
}

export async function publishSitePage(pageKey: string, updatedAt: string) {
  const client = requireSupabase();
  if (!updatedAt) throw new Error("Save this draft before publishing it.");
  const { data, error } = await client.rpc("publish_site_page", {
    p_page_key: requirePageKey(pageKey),
    p_expected_updated_at: updatedAt,
  });
  if (error) {
    if (error.code === "40001") {
      throw new Error("This page changed in another editor. Refresh before publishing it.");
    }
    throw new Error(`Unable to publish this page: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("The website page could not be published. Refresh and try again.");
  return contentRecordFromRow(row);
}

export async function revertSiteDraft(pageKey: string, updatedAt: string) {
  const client = requireSupabase();
  if (!updatedAt) return seedContentRecord(pageKey);
  const { data, error } = await client.rpc("revert_site_page_draft", {
    p_page_key: requirePageKey(pageKey),
    p_expected_updated_at: updatedAt,
  });
  if (error) {
    if (error.code === "40001") {
      throw new Error("This page changed in another editor. Refresh before discarding changes.");
    }
    throw new Error(`Unable to discard this draft: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("The website draft could not be reset. Refresh and try again.");
  return contentRecordFromRow(row);
}

export async function uploadSiteContentImage(
  pageKey: string,
  file: File,
  slot = "image",
) {
  const prefix = `pages/${safePathSegment(pageKey)}/${safePathSegment(slot)}`;
  const full = await uploadImage(SITE_IMAGE_BUCKET, `${prefix}/full`, file, {
    maxEdge: 2400,
    quality: 0.84,
    suffix: "-page",
  });
  try {
    const thumbnail = await uploadImage(SITE_IMAGE_BUCKET, `${prefix}/admin`, file, {
      maxEdge: 640,
      quality: 0.78,
      reencodeThreshold: 256 * 1024,
      suffix: "-admin",
    });
    return {
      src: full.url,
      storagePath: full.path,
      thumbnail: thumbnail.url,
      thumbnailPath: thumbnail.path,
    };
  } catch (error) {
    await removeStorageImages(SITE_IMAGE_BUCKET, [full.path]).catch(() => undefined);
    throw error;
  }
}

export async function removeSiteContentImages(paths: string[]) {
  await removeStorageImages(SITE_IMAGE_BUCKET, paths);
}
