import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));
const liveAssetDir = path.join(root, "public", "assets", "live");

const extensionFromImageBytes = (bytes: Buffer) => {
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return ".png";
  }

  const header = bytes.subarray(0, 32).toString("ascii");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return ".gif";
  if (header.slice(4, 8) === "ftyp" && /avif|avis/.test(header.slice(8))) return ".avif";
  return "";
};

const sourceExtensions = new Set([".css", ".html", ".json", ".mjs", ".ts", ".tsx"]);

const collectSourceFiles = async (entryPath: string): Promise<string[]> => {
  const entries = await readdir(entryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const childPath = path.join(entryPath, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(childPath);
      return sourceExtensions.has(path.extname(entry.name)) ? [childPath] : [];
    }),
  );
  return files.flat();
};

describe("live image assets", () => {
  it("uses a filename extension matching each image payload", async () => {
    const assetNames = await readdir(liveAssetDir);

    for (const assetName of assetNames) {
      const bytes = await readFile(path.join(liveAssetDir, assetName));
      expect(extensionFromImageBytes(bytes), assetName).toBe(path.extname(assetName).toLowerCase());
    }
  });

  it("keeps every repository live-asset reference resolvable", async () => {
    const sourceFiles = [
      path.join(root, "index.html"),
      ...(await collectSourceFiles(path.join(root, "scripts"))),
      ...(await collectSourceFiles(path.join(root, "src"))),
    ];
    const missingReferences = new Set<string>();

    for (const sourceFile of sourceFiles) {
      const source = await readFile(sourceFile, "utf8");
      for (const match of source.matchAll(/\/assets\/live\/([a-z0-9._-]+)/gi)) {
        const assetName = match[1];
        try {
          await access(path.join(liveAssetDir, assetName));
        } catch {
          missingReferences.add(`${path.relative(root, sourceFile)}: ${assetName}`);
        }
      }
    }

    expect([...missingReferences]).toEqual([]);
  });

  it("permanently redirects every renamed legacy image URL to its WebP file", async () => {
    const assetNames = await readdir(liveAssetDir);
    const expectedRedirects = new Map<string, string>();
    for (const assetName of assetNames) {
      const match = assetName.match(/-(jpg|jpeg|png)\.webp$/);
      if (!match) continue;
      const legacyName = assetName.replace(/\.webp$/, `.${match[1]}`);
      expectedRedirects.set(
        `/assets/live/${legacyName}`,
        `/assets/live/${assetName}`,
      );
    }

    const redirectsSource = await readFile(path.join(root, "public", "_redirects"), "utf8");
    const legacyRules = redirectsSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("/assets/live/"))
      .map((line) => line.split(/\s+/));
    const actualRedirects = new Map(legacyRules.map(([source, destination]) => [source, destination]));

    expect(legacyRules).toHaveLength(expectedRedirects.size);
    expect(actualRedirects.size).toBe(expectedRedirects.size);
    for (const [source, destination] of expectedRedirects) {
      expect(actualRedirects.get(source), source).toBe(destination);
      const rule = legacyRules.find(([ruleSource]) => ruleSource === source);
      expect(rule?.[2], source).toBe("301");
      await expect(access(path.join(root, "public", destination))).resolves.toBeUndefined();
    }
  });
});
