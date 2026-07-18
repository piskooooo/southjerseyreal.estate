import { describe, expect, it } from "vitest";
import { compliance } from "./compliance";
import { generatedPages } from "./generatedSiteData";
import { resourcePages } from "./resourcePages";
import { seoEntries } from "./seo";
import { managedContentSeeds, validateManagedContentForPublish } from "./siteEditor";
import type { ManagedPageDocument } from "./siteEditor";

const highRiskCopy = /family[- ]friendly|ideal for families|perfect for families|young professionals?|retirees?|empty nesters?|safe(?:st)? (?:neighborhood|community|area)|great schools?|excellent schools?|strong schools?|reputable schools?|best school|good schools?|most sought[- ]after|exclusive|prestigious|top dollar|sell faster|deliver results/i;

describe("compiled compliance guardrails", () => {
  it("keeps verified brokerage and salesperson facts in one complete configuration", () => {
    expect(compliance.brokerLegalName).toBe("THE PLUM REAL ESTATE GROUP LLC");
    expect(compliance.brokerDescriptor).toBe("New Jersey Real Estate Broker");
    expect(compliance.licensedOfficePhone).toBe("(856) 537-5464");
    expect(compliance.licensedOfficeAddress).toBe("901 Cooper St, Suite 2, Deptford, NJ 08096");
    expect(compliance.agentLicenseNumber).toBe("2187170");
    expect(JSON.stringify(compliance)).not.toMatch(/\[?VERIFY/i);
  });

  it("allows every compiled editor document through the publish checks", () => {
    for (const [pageKey, content] of managedContentSeeds) {
      expect(() => validateManagedContentForPublish(pageKey, structuredClone(content))).not.toThrow();
    }
  });

  it("does not publish an unverified membership mark or high-risk community copy", () => {
    const publicContent = JSON.stringify({
      generatedPages,
      resources: resourcePages,
      seoEntries,
      managed: [...managedContentSeeds.values()],
    });
    expect(compliance.realtorMembershipVerified).toBe(false);
    expect(compliance.idxListingsEnabled).toBe(false);
    expect(publicContent).not.toMatch(/REALTOR(?:®|\(R\))?/i);
    expect(publicContent).not.toMatch(highRiskCopy);
  });

  it("limits imported content to neutral county directories", () => {
    expect(generatedPages).toHaveLength(7);
    expect(generatedPages.every((page) => page.path.endsWith("-county"))).toBe(true);
    for (const page of generatedPages) {
      expect(page.sections[0]?.kind).toBe("intro");
      expect(page.sections.at(-1)?.kind).toBe("action");
      expect(page.sections.filter((section) => section.kind === "town").length).toBeGreaterThan(0);
    }
  });

  it("withholds unverified settlement-service provider entries", () => {
    const directory = JSON.stringify(resourcePages["/partners"]);
    expect(compliance.providerDirectoryVerificationComplete).toBe(false);
    expect(directory).toContain("HomeBase CRM");
    expect(directory).toContain(compliance.brokerLegalName);
    expect(directory).not.toMatch(/mortgage broker|title compan|settlement agent|home inspector/i);
  });

  it("rejects unsafe editor copy before it can be published", () => {
    const home = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    home.seo.title = "South Jersey Homes for Sale";
    expect(() => validateManagedContentForPublish("/", home)).toThrow(/IDX integration/i);

    const county = structuredClone(managedContentSeeds.get("/atlantic-county")) as ManagedPageDocument;
    county.page.sections[1].blocks[1].text = "A family-friendly community with great schools.";
    expect(() => validateManagedContentForPublish("/atlantic-county", county)).toThrow(/subjective|steering/i);

    const directory = structuredClone(managedContentSeeds.get("/partners")) as ManagedPageDocument;
    directory.resourcePage!.panels.push({ id: "unverified", title: "Unverified Provider", summary: "", blocks: [] });
    expect(() => validateManagedContentForPublish("/partners", directory)).toThrow(/locked/i);
  });
});
