// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderCountyCommunities } from "./prerenderCommunities";
import {
  normalizeManagedContent,
  seedPublicSiteContent,
  validateManagedContentForPublish,
  type ManagedPageDocument,
} from "./siteEditor";
import type { PageSection, SitePage } from "./types";

const parse = (page: SitePage) => {
  const element = document.createElement("main");
  element.innerHTML = renderCountyCommunities(page);
  return element;
};

const town = (id: string, name: string): PageSection => ({
  id,
  kind: "town",
  images: [],
  blocks: [
    { tag: "H3", text: name },
    { tag: "P", text: `Published summary for ${name}.` },
    { tag: "P", text: "Schools (2025 site snapshot): historical detail." },
    { tag: "SOURCE", text: "Municipal source", href: "https://EXAMPLE.gov", accessed: "2026-10-16" },
  ],
});

describe("county community prerender", () => {
  it("uses accepted published edits, order, and removals rather than restoring the seed town list", () => {
    const seed = structuredClone(seedPublicSiteContent().pages.get("/camden-county")!);
    const towns = seed.page.sections.filter((section) => section.kind === "town");
    const edited = towns[1];
    edited.blocks[0].text = "Reviewed Borough & Township";
    edited.blocks[1].text = "This is the owner's published summary rather than the compiled fallback.";
    const source = edited.blocks.find((block) => block.tag === "SOURCE")!;
    source.text = "Reviewed municipal facts";
    source.href = "https://example.gov/facts?version=2&format=html";
    source.accessed = "2026-10-16";
    seed.page.sections = [seed.page.sections[0], edited, towns[0]];
    const published = normalizeManagedContent("/camden-county", seed) as ManagedPageDocument;
    validateManagedContentForPublish("/camden-county", published);

    const element = parse(published.page);
    const profiles = [...element.querySelectorAll("article")];
    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.dataset.townCardKey)).toEqual([edited.id, towns[0].id]);
    expect(profiles[0].id).toBe("reviewed-borough-township");
    expect(profiles[0].querySelector(".town-card-summary p")?.textContent).toBe(edited.blocks[1].text);
    expect(profiles[0].querySelector(".content-source-note a")?.getAttribute("href")).toBe(source.href);
    expect(profiles[0].querySelector(".content-source-note")?.textContent).toContain("Accessed 2026-10-16.");
    expect(element.textContent).not.toContain(towns[2].blocks[0].text);
    expect(element.textContent).not.toContain("Schools (2025 site snapshot)");
  });

  it("preserves legacy image-based town detection and the original section index for fallback anchors", () => {
    const image = { src: "/town.webp", alt: "Town" };
    const legacy = { ...town("", "Legacy Town"), kind: undefined, images: [image] };
    legacy.blocks[0] = { tag: "H4", text: "Legacy Town" };
    const element = parse({
      path: "/camden-county",
      title: "Camden County",
      sections: [
        { id: "intro", images: [image], blocks: [{ tag: "H2", text: "County introduction" }] },
        { id: "action", images: [image], blocks: [{ tag: "H2", text: "Thinking of Selling?" }, { tag: "H2", text: "Looking to Buy?" }] },
        legacy,
        town("explicit-town", "Explicit Town"),
      ],
    });
    expect([...element.querySelectorAll("article")].map((profile) => profile.id)).toEqual(["community-3", "explicit-town"]);
    expect(element.querySelector("article")?.dataset.townCardKey).toBe("2");
    expect(element.textContent).not.toContain("County introduction");
    expect(element.textContent).not.toContain("Thinking of Selling?");
  });

  it("escapes text, identifiers, dates, and source attributes without producing active HTML", () => {
    const section = town('town" onmouseover="bad', 'Town <script>bad()</script> & Borough');
    section.blocks[1].text = '<img src="x" onerror="bad()">';
    section.blocks[3] = {
      tag: "SOURCE",
      text: '</a><img src="x" onerror="bad()">',
      href: 'https://example.gov/?q=" onclick="bad()',
      accessed: '<svg onload="bad()">',
    };
    const element = parse({ path: "/camden-county", title: "County", sections: [section] });
    expect(element.querySelectorAll("script, img, svg, [onerror], [onclick], [onmouseover]")).toHaveLength(0);
    expect(element.querySelector("article")?.dataset.townCardKey).toBe(section.id);
    expect(element.querySelector(".town-card-summary p")?.textContent).toBe(section.blocks[1].text);
    expect(element.querySelector(".content-source-note a")?.textContent).toBe(section.blocks[3].text);
    expect(element.querySelector(".content-source-note span")?.textContent).toBe(`Accessed ${section.blocks[3].accessed}.`);
    expect(element.querySelector(".content-source-note a")?.getAttribute("href")).toBe(new URL(section.blocks[3].href!).href);
  });

  it("keeps all source titles/dates but never links unsafe source URLs", () => {
    const section = town("town", "Town");
    section.blocks.push(...["http://example.gov", "https://user:secret@example.gov", "javascript:bad()", "//example.gov"].map((href) => ({
      tag: "SOURCE", text: "Source without a safe URL", href, accessed: "2026-10-16",
    })));
    const element = parse({ path: "/camden-county", title: "County", sections: [section] });
    expect(element.querySelectorAll(".content-source-note")).toHaveLength(5);
    expect(element.querySelectorAll(".content-source-note a")).toHaveLength(1);
    expect(element.querySelector(".content-source-note a")?.getAttribute("href")).toBe("https://example.gov/");
    expect(element.querySelectorAll(".content-source-note span")).toHaveLength(5);
    expect(element.querySelectorAll("button, img, [hidden]")).toHaveLength(0);
    expect(element.querySelectorAll('[aria-label="Community information note"]')).toHaveLength(1);
  });

  it("does not add community content to other pages or restore removed towns", () => {
    expect(renderCountyCommunities({ path: "/about", title: "About", sections: [town("town", "Town")] })).toBe("");
    expect(renderCountyCommunities({ path: "/camden-county", title: "County", sections: [] })).toBe("");
  });
});
