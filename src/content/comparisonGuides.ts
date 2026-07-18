import { outOfStateServiceDisclosure } from "./compliance";

export type ComparisonTopic = {
  heading: string;
  primary: string;
  secondary: string;
  takeaway: string;
};

export type ComparisonPanel = {
  id: string;
  title: string;
  summary: string;
  primaryLabel: string;
  secondaryLabel: string;
  topics: ComparisonTopic[];
  bottomLine: string;
};

export type ComparisonGuide = {
  path: string;
  title: string;
  intro: string;
  supportText: string;
  panels: ComparisonPanel[];
  closingTitle: string;
  closingText: string;
  closingLink: {
    label: string;
    href: string;
  };
};

export const comparisonGuides: Record<string, ComparisonGuide> = {
  "/why-new-jersey": {
    path: "/why-new-jersey",
    title: "New Jersey Regional Comparison",
    intro:
      "This general comparison identifies jurisdictional and geographic questions to research when considering New Jersey, Pennsylvania, Delaware, or New York. It does not rank locations or recommend one location for any person or household.",
    supportText: outOfStateServiceDisclosure,
    panels: [
      {
        id: "regional-geography",
        title: "Geography and jurisdiction",
        summary: "Compare location, governing jurisdiction, and the official records that apply to a property.",
        primaryLabel: "New Jersey",
        secondaryLabel: "Neighboring states",
        topics: [
          {
            heading: "Property records",
            primary:
              "New Jersey property, tax, zoning, flood, school-district, and municipal-service information should be checked with the responsible New Jersey agency or municipality.",
            secondary:
              "Pennsylvania, Delaware, and New York use their own state and local agencies, terminology, procedures, and records.",
            takeaway:
              "Use current records from the jurisdiction where the property is located; do not rely on a cross-state summary for a transaction decision.",
          },
          {
            heading: "Professional services",
            primary:
              "Arthur Pisko Jr. is licensed to provide real-estate brokerage services in New Jersey through THE PLUM REAL ESTATE GROUP LLC.",
            secondary:
              "A transaction outside New Jersey may require a professional licensed in that state.",
            takeaway:
              "Confirm the professional's current license and authority in the property's jurisdiction before engaging services.",
          },
        ],
        bottomLine:
          "State and local rules vary. Verify any fact material to a transaction with the appropriate public agency and qualified professional.",
      },
      {
        id: "regional-access",
        title: "Transportation and regional access",
        summary: "Research a specific address instead of relying on broad regional assumptions.",
        primaryLabel: "New Jersey address",
        secondaryLabel: "Comparison address",
        topics: [
          {
            heading: "Travel planning",
            primary:
              "Check current route, transit, toll, parking, and travel-time information for the specific New Jersey address and the times you expect to travel.",
            secondary:
              "Apply the same address-specific review to any comparison property in another state.",
            takeaway:
              "Travel conditions and service schedules change; test the actual trip and consult the current operator or transportation agency.",
          },
        ],
        bottomLine:
          "A location's suitability is personal. This site does not characterize a neighborhood based on residents, schools, safety, or protected characteristics.",
      },
    ],
    closingTitle: "Continue with New Jersey community guides",
    closingText:
      "The county guides provide neutral community directories. Verify current details with the municipality, county, and other responsible sources.",
    closingLink: {
      label: "Compare North and South Jersey",
      href: "/why-south-jersey",
    },
  },
  "/why-south-jersey": {
    path: "/why-south-jersey",
    title: "North and South Jersey Regional Comparison",
    intro:
      "North Jersey and South Jersey are informal regional descriptions, not official legal boundaries. This guide offers neutral questions for comparing specific New Jersey locations.",
    supportText:
      "No community is ranked or matched to a type of person. Use current, address-specific information from public agencies and qualified professionals.",
    panels: [
      {
        id: "nj-regional-reference",
        title: "Regional reference points",
        summary: "Use the terms as general orientation, then research a specific county and municipality.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Geographic description",
            primary:
              "This site uses South Jersey to organize Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem County guides.",
            secondary:
              "North Jersey commonly refers to counties in the northern part of the state, but definitions differ by source.",
            takeaway:
              "Use the county and municipality name, not an informal regional label, when checking official information.",
          },
          {
            heading: "Public information",
            primary:
              "For a South Jersey address, consult the relevant municipality, county, school district, tax assessor, flood-map source, and transportation operator as applicable.",
            secondary:
              "Use the corresponding agencies and records for any North Jersey comparison address.",
            takeaway:
              "The same verification process applies throughout New Jersey, even when the responsible agencies differ.",
          },
        ],
        bottomLine:
          "Regional labels are only a starting point. Property-specific due diligence should use current official and professional sources.",
      },
      {
        id: "nj-property-comparison",
        title: "Property and transaction questions",
        summary: "Compare facts about specific properties without generalizing about communities or residents.",
        primaryLabel: "First property",
        secondaryLabel: "Comparison property",
        topics: [
          {
            heading: "Property characteristics",
            primary:
              "Document the property type, condition, utilities, zoning, association obligations, taxes, insurance considerations, and inspection findings for the first address.",
            secondary:
              "Collect the same current information for the comparison address.",
            takeaway:
              "Use the same evidence categories for both properties so the comparison is based on facts relevant to the transaction.",
          },
          {
            heading: "Personal criteria",
            primary:
              "Write down your own travel, budget, property, and service priorities without asking a real-estate professional to steer you toward or away from a protected class or neighborhood.",
            secondary:
              "Apply those same personal criteria consistently to the comparison property.",
            takeaway:
              "The decision belongs to the consumer; the role of this guide is to identify neutral research categories.",
          },
        ],
        bottomLine:
          "Ask for objective, current information and make your own location decision based on your needs.",
      },
    ],
    closingTitle: "Explore the county directories",
    closingText:
      "Each county page lists communities without rating schools, safety, residents, value, prestige, or suitability.",
    closingLink: {
      label: "Explore Atlantic County",
      href: "/atlantic-county",
    },
  },
};
