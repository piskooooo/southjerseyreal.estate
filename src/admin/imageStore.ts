import { supabase } from "./supabase";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const imageExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_EDGE = 12_000;
export const IMAGE_ACCEPT = [...allowedImageTypes].join(",");

class ImageDimensionError extends Error {}

export function safePathSegment(value: unknown) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "") || "image";
}

export function validateImage(file: File) {
  const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!allowedImageTypes.has(type)) {
    throw new Error(`${file.name} is not a supported JPG, PNG, WebP, or AVIF image.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than the 10 MB upload limit.`);
  }
  return type;
}

export async function optimizeImage(
  file: File,
  {
    maxEdge = 2400,
    quality = 0.84,
    reencodeThreshold = 3 * 1024 * 1024,
    suffix = "",
  }: {
    maxEdge?: number;
    quality?: number;
    reencodeThreshold?: number;
    suffix?: string;
  } = {},
) {
  validateImage(file);
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    if (
      bitmap.width > MAX_IMAGE_EDGE
      || bitmap.height > MAX_IMAGE_EDGE
      || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS
    ) {
      throw new ImageDimensionError(`${file.name} has image dimensions that are too large to process safely.`);
    }
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const resized = scale < 1;
    if (!resized && file.size <= reencodeThreshold) return file;

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return file;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => (
      canvas.toBlob(resolve, "image/webp", quality)
    ));
    if (!blob || (!resized && blob.size >= file.size)) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}${suffix}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch (error) {
    if (error instanceof ImageDimensionError) throw error;
    return file;
  } finally {
    bitmap?.close();
  }
}

export async function uploadImage(
  bucket: string,
  pathPrefix: string,
  sourceFile: File,
  options: Parameters<typeof optimizeImage>[1],
) {
  if (!supabase) throw new Error("Image storage is not connected to Supabase yet.");
  const file = await optimizeImage(sourceFile, options);
  const contentType = validateImage(file);
  const extension = imageExtensions[contentType];
  const normalizedPrefix = pathPrefix.split("/").map(safePathSegment).join("/");
  const path = `${normalizedPrefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`${file.name} could not be uploaded: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeStorageImages(bucket: string, paths: string[]) {
  const uploadedPaths = [...new Set(paths.filter(Boolean))];
  if (!uploadedPaths.length || !supabase) return;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await supabase.storage.from(bucket).remove(uploadedPaths);
    if (!error) return;
    lastError = error.message;
  }
  throw new Error(lastError || "The stored image could not be removed.");
}
