import { describe, expect, it } from "vitest";
import { buildStructuredData, getSeoForPath, siteUrl } from "./seo";
import type { SitePage } from "./types";

const page = (path: string, title: string): SitePage => ({ path, title, sections: [] });

describe("SEO metadata", () => {
  it("omits a one-item breadcrumb list on the home page", () => {
    const graph = buildStructuredData("/", page("/", "South Jersey Real Estate"))["@graph"];
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

  it("limits professional identity markup to the About and Contact pages", () => {
    const countyGraph = buildStructuredData(
      "/atlantic-county",
      page("/atlantic-county", "Atlantic County, New Jersey Community Guide"),
    )["@graph"];
    const aboutGraph = buildStructuredData(
      "/about",
      page("/about", "About Arthur Pisko Jr."),
    )["@graph"];

    expect(countyGraph.some((item) => item["@id"] === `${siteUrl}/#agent`)).toBe(false);
    expect(countyGraph.some((item) => item["@id"] === `${siteUrl}/#brokerage`)).toBe(false);
    expect(aboutGraph.some((item) => item["@id"] === `${siteUrl}/#agent`)).toBe(true);
    expect(aboutGraph.some((item) => item["@id"] === `${siteUrl}/#brokerage`)).toBe(true);
  });
});
