import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Requires cwebp. Regenerate derivatives without replacing the approved originals.
const assetRoot = fileURLToPath(new URL("../public/assets/", import.meta.url));
const outputRoot = path.join(assetRoot, "responsive");
mkdirSync(outputRoot, { recursive: true });

const photos = [
  { source: "home-light-hero-beach-sunrise.jpg", name: "home-beach", widths: [480, 960, 1440, 1920] },
  { source: "live/philly-skyline-from-camden-city-camden-jpg.webp", name: "home-skyline", widths: [480, 960, 1500] },
  { source: "live/pitman-gloucester-jpg.webp", name: "home-pitman", widths: [480, 960, 1280] },
];
for (const photo of photos) {
  for (const width of photo.widths) {
    const quality = photo.name === "home-pitman" && width === 1280 ? "74" : "82";
    execFileSync("cwebp", ["-quiet", "-q", quality, "-m", "6", "-resize", String(width), "0",
      path.join(assetRoot, photo.source), "-o", path.join(outputRoot, `${photo.name}-${width}.webp`)]);
  }
}

for (const [source, name] of [
  ["equal-housing-opportunity-logo.webp", "equal-housing-opportunity-logo"],
  ["realtor-logo.png", "realtor-logo"],
]) {
  execFileSync("cwebp", ["-quiet", "-lossless", "-m", "6", "-resize", "120", "0",
    path.join(assetRoot, source), "-o", path.join(outputRoot, `${name}.webp`)]);
}
