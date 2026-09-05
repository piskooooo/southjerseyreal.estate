// @vitest-environment jsdom
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FairHousingNotice } from "../components/Compliance";
import { buildHomeHeroPreloadScript, getResponsiveImageProps } from "./responsiveImages";

const lightSrc = "/assets/home-light-hero-beach-sunrise.jpg";
const darkSrc = "/assets/live/philly-skyline-from-camden-city-camden-jpg.webp";
const guidanceSrc = "/assets/live/pitman-gloucester-jpg.webp";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("responsive public images", () => {
  it("provides smaller, valid WebP choices for the approved photography", () => {
    for (const source of [lightSrc, darkSrc, guidanceSrc]) {
      const props = getResponsiveImageProps(source, source === guidanceSrc ? "guidance" : "hero");
      expect(props.src).not.toBe(source);
      expect(props.sizes).toContain("900px");
      const choices = props.srcSet!.split(", ");
      expect(choices.length).toBeGreaterThanOrEqual(3);
      for (const choice of choices) {
        const [url, width] = choice.split(" ");
        expect(width).toMatch(/^\d+w$/);
        const image = readFileSync(path.join(projectRoot, `public${url}`));
        expect(image.subarray(8, 12).toString()).toBe("WEBP");
        expect(image.length).toBeLessThan(200_000);
      }
      expect(props.width).toBeGreaterThan(0);
      expect(props.height).toBeGreaterThan(0);
    }
  });

  it("preserves custom editor images without guessing derivatives", () => {
    const source = "https://example.org/custom-home-photo.webp";
    expect(getResponsiveImageProps(source, "hero")).toEqual({ src: source });
  });

  it.each(["light", "dark"])("preloads only the selected %s desktop hero", (theme) => {
    const doc = document.implementation.createHTMLDocument();
    const browser = { matchMedia: () => ({ matches: true }), localStorage: { getItem: () => theme } };
    new Function("window", "document", buildHomeHeroPreloadScript({ lightSrc, darkSrc }))(browser, doc);
    const links = doc.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(getResponsiveImageProps(theme === "dark" ? darkSrc : lightSrc, "hero").src);
    expect(links[0].getAttribute("imagesrcset")).toContain("480w");
    expect(links[0].getAttribute("imagesizes")).toBe(getResponsiveImageProps(lightSrc, "hero").sizes);
    expect(links[0].getAttribute("fetchpriority")).toBe("high");
    expect(links[0].getAttribute("media")).toBe("(min-width: 901px)");
  });

  it("leaves the below-fold mobile hero out of early loading", () => {
    const doc = document.implementation.createHTMLDocument();
    const browser = { matchMedia: () => ({ matches: false }), localStorage: { getItem: () => "light" } };
    new Function("window", "document", buildHomeHeroPreloadScript({ lightSrc, darkSrc }))(browser, doc);
    expect(doc.head.querySelector('link[rel="preload"]')).toBeNull();
  });

  it("uses the light default when storage is unavailable and escapes custom URLs", () => {
    const doc = document.implementation.createHTMLDocument();
    const customSrc = 'https://example.org/image.webp?name=</script><script>alert(1)</script>';
    const script = buildHomeHeroPreloadScript({ lightSrc: customSrc, darkSrc });
    expect(script).not.toContain("</script>");
    const browser = { matchMedia: () => ({ matches: true }), localStorage: { getItem: () => { throw new Error("Unavailable"); } } };
    new Function("window", "document", script)(browser, doc);
    expect(doc.head.querySelector('link[rel="preload"]')?.getAttribute("href")).toBe(customSrc);
  });

  it("delivers small, lazy footer marks with their existing accessible names", () => {
    const { container } = render(<FairHousingNotice navigate={() => {}} />);
    const marks = container.querySelectorAll("img");
    expect([...marks].map((image) => image.alt)).toEqual(["Equal Housing Opportunity", "REALTOR® member logo"]);
    for (const image of marks) {
      expect(image.getAttribute("loading")).toBe("lazy");
      expect(image.getAttribute("decoding")).toBe("async");
      expect(Number(image.getAttribute("width"))).toBeLessThanOrEqual(120);
      expect(statSync(path.join(projectRoot, `public${image.getAttribute("src")}`)).size).toBeLessThan(10_000);
    }
  });
});
