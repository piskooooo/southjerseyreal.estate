import { describe, expect, it } from "vitest";
import { buildStructuredData, getSeoForPath, siteUrl } from "./seo";
import type { SitePage } from "./types";

const page = (path: string, title: string): SitePage => ({ path, title, sections: [] });

describe("SEO metadata", () => {
  it("omits a one-item breadcrumb list on the home page", () => {
    const graph = buildStructuredData("/", page("/", "South Jersey Real Estate Guide"))["@graph"];
    expect(graph.some((item) => item["@type"] === "BreadcrumbList")).toBe(false);
  });

  it("builds county breadcrumbs through the Counties hub", () => {
    const graph = buildStructuredData(
      "/atlantic-county",
      page("/atlantic-county", "Atlantic County, New Jersey Community Guide"),
    )["@graph"];
    const breadcrumbs = graph.find((item) => item["@type"] === "BreadcrumbList");

    expect(breadcrumbs?.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: "Home", item: `${siteUrl}/` }),
      expect.objectContaining({ position: 2, name: "Counties", item: `${siteUrl}/counties` }),
      expect.objectContaining({ position: 3, item: `${siteUrl}/atlantic-county` }),
    ]);
  });

  it("uses the active site name and known social-image metadata", () => {
    const seo = getSeoForPath(
      "/atlantic-county",
      page("/atlantic-county", "Atlantic County, New Jersey Community Guide"),
    );
    const graph = buildStructuredData(
      "/atlantic-county",
      page("/atlantic-county", "Atlantic County, New Jersey Community Guide"),
      undefined,
      "South Jersey Property Guide",
    )["@graph"];
    const website = graph.find((item) => item["@type"] === "WebSite");

    expect(website?.name).toBe("South Jersey Property Guide");
    expect(seo).toMatchObject({
      imageAlt: "Map highlighting Atlantic County, New Jersey.",
      imageHeight: 2047,
      imageType: "image/webp",
      imageWidth: 1081,
    });
  });
});
