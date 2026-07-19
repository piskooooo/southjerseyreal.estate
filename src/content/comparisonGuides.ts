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
      "New Jersey sits between several distinct real estate markets. Use this guide to compare practical differences in records, services, travel, and professional licensing.",
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
              "Property, tax, zoning, flood, school-district, and municipal-service records come from the responsible New Jersey agencies and municipalities.",
            secondary:
              "Pennsylvania, Delaware, and New York use their own state and local agencies, terminology, procedures, and records.",
            takeaway:
              "Compare each property using records from the state and municipality where it is located.",
          },
          {
            heading: "Professional services",
            primary:
              "Arthur Pisko Jr. is licensed to provide real-estate brokerage services in New Jersey through THE PLUM REAL ESTATE GROUP LLC.",
            secondary:
              "A transaction outside New Jersey may require a professional licensed in that state.",
            takeaway:
              "The professional helping with a transaction must be authorized to work in the state where the property is located.",
          },
        ],
        bottomLine:
          "The details vary by state and town, so the right source depends on the address.",
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
              "Look at routes, transit, tolls, parking, and travel times for the specific New Jersey address and the times you expect to travel.",
            secondary:
              "Apply the same address-specific review to any comparison property in another state.",
            takeaway:
              "Test the actual trip at the times that matter to your routine.",
          },
        ],
        bottomLine:
          "The useful comparison is the one that reflects your actual routine.",
      },
    ],
    closingTitle: "Continue with New Jersey community guides",
    closingText:
      "Start with the South Jersey county guides, then explore the towns and cities that interest you.",
    closingLink: {
      label: "Compare North and South Jersey",
      href: "/why-south-jersey",
    },
  },
  "/why-south-jersey": {
    path: "/why-south-jersey",
    title: "North and South Jersey Regional Comparison",
    intro:
      "North Jersey and South Jersey are informal regional descriptions, not official boundaries. The meaningful differences usually appear when you compare particular counties, towns, and properties.",
    supportText:
      "Use the regional labels as a starting point, then narrow the comparison to the details that matter to you.",
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
              "This site focuses its South Jersey coverage on Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
            secondary:
              "North Jersey commonly refers to counties in the northern part of the state, but definitions differ by source.",
            takeaway:
              "County and municipality names are more useful than regional labels once the search becomes specific.",
          },
          {
            heading: "Public information",
            primary:
              "For a South Jersey address, the relevant town, county, school district, tax assessor, flood-map source, and transportation operator hold different pieces of the picture.",
            secondary:
              "Use the corresponding agencies and records for any North Jersey comparison address.",
            takeaway:
              "The research categories stay consistent even when the responsible agencies change.",
          },
        ],
        bottomLine:
          "Regional labels help with orientation; the property and its location provide the useful detail.",
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
              "Using the same checklist for both properties makes the tradeoffs easier to see.",
          },
          {
            heading: "Personal criteria",
            primary:
              "List the travel, budget, property, and service priorities that matter to you.",
            secondary:
              "Apply those same personal criteria consistently to the comparison property.",
            takeaway:
              "A consistent checklist makes the comparison more useful.",
          },
        ],
        bottomLine:
          "Focus on the facts and tradeoffs that connect to your plans.",
      },
    ],
    closingTitle: "Explore the county directories",
    closingText:
      "Each county page introduces the towns and cities featured across that part of South Jersey.",
    closingLink: {
      label: "Explore Atlantic County",
      href: "/atlantic-county",
    },
  },
};
