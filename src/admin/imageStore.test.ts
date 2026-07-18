import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  optimizeImage,
  validateImage,
} from "./imageStore";

function testFile(
  name: string,
  type: string,
  size = 8,
) {
  return new File([new Uint8Array(size)], name, { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("website editor image validation", () => {
  it("rejects image formats outside the public upload allowlist", () => {
    expect(() => validateImage(testFile("vector.svg", "image/svg+xml")))
      .toThrow("is not a supported JPG, PNG, WebP, or AVIF image");
  });

  it("rejects files above the 10 MB upload limit", () => {
    expect(() => validateImage(testFile("oversized.jpg", "image/jpeg", MAX_IMAGE_BYTES + 1)))
      .toThrow("is larger than the 10 MB upload limit");
  });

  it("rejects decoded images with unsafe dimensions", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({
      width: MAX_IMAGE_EDGE + 1,
      height: 1,
      close,
    }));

    await expect(optimizeImage(testFile("dimensions.jpg", "image/jpeg")))
      .rejects.toThrow("has image dimensions that are too large to process safely");
    expect(close).toHaveBeenCalledOnce();
  });
});
