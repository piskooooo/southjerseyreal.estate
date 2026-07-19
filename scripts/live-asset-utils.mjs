const contentTypeExtensions = new Map([
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const startsWith = (bytes, signature) =>
  signature.every((value, index) => bytes[index] === value);

export const extensionFromImageBytes = (bytes) => {
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return ".jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return ".png";

  const header = bytes.subarray(0, 32).toString("ascii");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return ".gif";
  if (header.slice(4, 8) === "ftyp" && /avif|avis/.test(header.slice(8))) return ".avif";

  return "";
};

export const extensionForImageResponse = ({ bytes, contentType = "", sourceUrl = "" }) => {
  const detectedExtension = extensionFromImageBytes(bytes);
  if (detectedExtension) return detectedExtension;

  const normalizedContentType = contentType.split(";", 1)[0].trim().toLowerCase();
  const contentTypeExtension = contentTypeExtensions.get(normalizedContentType);
  if (contentTypeExtension) return contentTypeExtension;

  throw new Error(`Unsupported image response from ${sourceUrl || "unknown source"}`);
};
