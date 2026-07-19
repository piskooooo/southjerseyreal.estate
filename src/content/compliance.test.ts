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

  it("publishes the verified membership mark without high-risk community copy", () => {
    const publicContent = JSON.stringify({
      generatedPages,
      resources: resourcePages,
      seoEntries,
      managed: [...managedContentSeeds.values()],
    });
    expect(compliance.realtorMembershipVerified).toBe(true);
    expect(compliance.idxListingsEnabled).toBe(false);
    expect(publicContent).toMatch(/REALTOR®/i);
    expect(publicContent).not.toMatch(highRiskCopy);
  });

  it("limits imported content to concise county directories", () => {
    expect(generatedPages).toHaveLength(7);
    expect(generatedPages.every((page) => page.path.endsWith("-county"))).toBe(true);
    for (const page of generatedPages) {
      expect(page.sections[0]?.kind).toBe("intro");
      expect(page.sections.at(-1)?.kind).toBe("action");
      expect(page.sections.filter((section) => section.kind === "town").length).toBeGreaterThan(0);
    }
  });

  it("publishes the verified unpaid real-estate provider directory", () => {
    const directory = JSON.stringify(resourcePages["/partners"]);
    expect(compliance.providerDirectoryVerificationComplete).toBe(true);
    expect(directory).toContain("Sam Hamilton");
    expect(directory).toContain("NMLS #1094595");
    expect(directory).toContain("Terri Santiago-Parker");
    expect(directory).toContain("Drew Whipple");
    expect(directory).toContain("Citizens");
    expect(directory).toContain("Cape Atlantic Title Agency, LLC");
    expect(directory).toContain("Foundation Title, LLC");
    expect(directory).toContain("Directory listings are not sold");
    expect(directory).not.toContain("Signature Title Agency");
    expect(directory).not.toMatch(/trusted recommendation|go-to partner|reliable and responsive/i);
  });

  it("keeps paid local advertising separate from settlement-service listings", () => {
    const advertising = JSON.stringify(resourcePages["/advertise"]);
    expect(advertising).toContain("Paid advertisement");
    expect(advertising).toContain("not part of a real estate transaction");
    expect(advertising).toContain("material relationship");
    expect(advertising).toContain("Placement Options");
  });

  it("rejects unsafe editor copy before it can be published", () => {
    const home = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    home.seo.title = "South Jersey Homes for Sale";
    expect(() => validateManagedContentForPublish("/", home)).toThrow(/IDX integration/i);

    const county = structuredClone(managedContentSeeds.get("/atlantic-county")) as ManagedPageDocument;
    county.page.sections[1].blocks[1].text = "A family-friendly community with great schools.";
    expect(() => validateManagedContentForPublish("/atlantic-county", county)).toThrow(/subjective|steering/i);

    const advertising = structuredClone(managedContentSeeds.get("/advertise")) as ManagedPageDocument;
    advertising.resourcePage!.supportText = "Paid placements are available.";
    advertising.resourcePage!.panels = [];
    expect(() => validateManagedContentForPublish("/advertise", advertising)).toThrow(/compliance language/i);
  });
});
