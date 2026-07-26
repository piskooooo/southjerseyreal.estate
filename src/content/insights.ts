import type { ContentBlock } from "./types";

export type InsightCard = {
  category: string;
  href: string;
  reviewedDate: string;
  summary: string;
  title: string;
};

export type InsightIndexContent = {
  eyebrow: string;
  introduction: string;
  title: string;
  articles: InsightCard[];
};

export type InsightSection = {
  heading: string;
  paragraphs: string[];
  checklist: string[];
};

export type InsightArticleContent = {
  category: string;
  eyebrow: string;
  notice: string;
  publishedDate: string;
  readingTime: string;
  reviewedDate: string;
  sections: InsightSection[];
  sources: ContentBlock[];
  summary: string;
  title: string;
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
};

const reviewedDate = "2026-07-25";

export const insightIndex: InsightIndexContent = {
  eyebrow: "Evergreen real-estate guidance",
  title: "South Jersey Real Estate Insights",
  introduction: "Practical, sourced guides for understanding the New Jersey buying and selling process and researching a South Jersey property. Each guide shows when it was last reviewed so you can tell when the underlying information was checked.",
  articles: [
    {
      category: "Buying",
      href: "/insights/new-jersey-homebuying-process",
      reviewedDate,
      summary: "A step-by-step view of budgeting, brokerage relationships, offers, mortgage disclosures, due diligence, and closing.",
      title: "A First Look at the New Jersey Homebuying Process",
    },
    {
      category: "Selling",
      href: "/insights/preparing-to-sell-a-new-jersey-home",
      reviewedDate,
      summary: "A calm pre-listing checklist covering property records, required disclosures, repair planning, pricing discussions, and offer review.",
      title: "Preparing to Sell a New Jersey Home",
    },
    {
      category: "Property research",
      href: "/insights/researching-a-south-jersey-property",
      reviewedDate,
      summary: "How to look beyond listing remarks by checking parcel data, municipal records, flood information, environmental maps, and recurring costs.",
      title: "Researching a South Jersey Property Beyond the Listing",
    },
  ],
};

export const insightArticles: Record<string, InsightArticleContent> = {
  "/insights/new-jersey-homebuying-process": {
    category: "Buying",
    eyebrow: "New Jersey buyer guide",
    notice: "This guide is general educational information, not legal, tax, insurance, inspection, lending, or financial advice. A particular transaction may require guidance from the appropriate licensed professionals.",
    publishedDate: reviewedDate,
    readingTime: "8 minute read",
    reviewedDate,
    summary: "Buying a home is easier to follow when the financial, representation, property, contract, and closing decisions are treated as separate checkpoints.",
    title: "A First Look at the New Jersey Homebuying Process",
    sections: [
      {
        heading: "Start with the whole housing budget",
        paragraphs: [
          "A purchase price or preapproval amount is only one part of affordability. Build a working monthly estimate that also considers property taxes, homeowners and possible flood insurance, association charges, utilities, maintenance, and the cash you expect to keep after closing.",
          "For a financed purchase, the Consumer Financial Protection Bureau's home-loan toolkit is a useful starting point for comparing loan options and estimating cash needed at closing. Your lender can explain the products actually available to you, while a tax, insurance, or financial professional can address questions within their field.",
        ],
        checklist: [
          "Set a comfortable monthly range before touring.",
          "Separate down-payment funds from closing costs and post-closing reserves.",
          "Ask for property-specific tax, insurance, association, and utility information when available.",
        ],
      },
      {
        heading: "Understand who represents whom",
        paragraphs: [
          "The New Jersey Real Estate Commission identifies four brokerage relationships: seller's agent, buyer's agent, disclosed dual agent, and transaction broker. The Consumer Information Statement explains these roles and the duties attached to each one.",
          "Read the relationship disclosure before sharing confidential negotiating information. Ask what services will be provided, how compensation works, what choices remain yours, and how any possible dual-agency situation would be handled.",
        ],
        checklist: [
          "Read the Consumer Information Statement.",
          "Ask questions about representation before discussing negotiating limits or motivation.",
          "Keep copies of signed brokerage and compensation agreements.",
        ],
      },
      {
        heading: "Treat an offer as a package of terms",
        paragraphs: [
          "Price matters, but so do the deposit, financing terms, inspection provisions, appraisal language, included property, closing target, and deadlines. The right structure depends on the property, the market, and your tolerance for risk.",
          "A real-estate licensee can explain market practice and prepare or present an offer within the scope of the licensee's role. Questions about legal consequences or contract language belong with a New Jersey attorney.",
        ],
        checklist: [
          "Confirm the property and included items are identified correctly.",
          "Understand every contingency and deadline before signing.",
          "Plan how the deposit and closing funds will be delivered securely.",
        ],
      },
      {
        heading: "Use due diligence to test your assumptions",
        paragraphs: [
          "After an offer is accepted, the work usually shifts toward inspections, title and survey questions, financing, insurance, appraisal, and review of available property and municipal information. These activities answer different questions and should not be treated as substitutes for one another.",
          "Keep a single transaction calendar and raise concerns promptly. Contract rights and response periods can be time-sensitive, so confirm the applicable dates with the professionals responsible for them.",
        ],
        checklist: [
          "Schedule authorized inspections within the contract timeline.",
          "Confirm insurance availability and cost for the specific property.",
          "Review title, survey, association, municipal, and seller-provided documents as applicable.",
        ],
      },
      {
        heading: "Compare the final loan documents before closing",
        paragraphs: [
          "For most covered mortgages, the lender provides a Loan Estimate early in the application process and a Closing Disclosure at least three business days before closing. The CFPB recommends comparing the final loan terms, projected payment, closing costs, and cash to close with the most recent Loan Estimate.",
          "Do not wait for the signing table to raise a discrepancy. Confirm how you will receive the documents, ask for the other closing documents in advance when possible, and independently verify wiring instructions using a trusted contact method.",
        ],
        checklist: [
          "Compare the Closing Disclosure with the latest Loan Estimate.",
          "Question unexpected changes in the rate, loan terms, payment, fees, or cash to close.",
          "Verify closing and wire instructions through known contact information before sending funds.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "Consumer Financial Protection Bureau — Your home loan toolkit", href: "https://www.consumerfinance.gov/owning-a-home/explore/home-loan-toolkit/", accessed: reviewedDate },
      { tag: "SOURCE", text: "New Jersey Department of Banking and Insurance — Real Estate Consumer Information", href: "https://www.nj.gov/dobi/division_consumers/realestate/re_menu.htm", accessed: reviewedDate },
      { tag: "SOURCE", text: "Consumer Financial Protection Bureau — Review documents before closing", href: "https://www.consumerfinance.gov/owning-a-home/close/review-documents-before-closing/", accessed: reviewedDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Contact Arthur", href: "/contact" },
    ],
  },
  "/insights/preparing-to-sell-a-new-jersey-home": {
    category: "Selling",
    eyebrow: "New Jersey seller guide",
    notice: "This guide is general educational information, not legal, tax, inspection, environmental, or repair advice. Disclosure and transaction requirements can depend on the property and circumstances.",
    publishedDate: reviewedDate,
    readingTime: "7 minute read",
    reviewedDate,
    summary: "Good preparation is less about making every surface new and more about organizing facts, decisions, documents, and responsibilities before the property reaches the market.",
    title: "Preparing to Sell a New Jersey Home",
    sections: [
      {
        heading: "Build a property file before the listing appointment",
        paragraphs: [
          "Gather the records that help explain the property: deed and ownership information, mortgage or lien contacts, tax bills, surveys, permits and approvals, warranties, repair invoices, association documents, leases, utility information, and records for major systems when available.",
          "Do not assume an old document is still complete or current. The goal is to identify missing information early enough to request it from the municipality, association, contractor, lender, or other appropriate source.",
        ],
        checklist: [
          "Confirm every person or entity that must participate in the sale.",
          "Locate surveys, permits, warranties, association records, and major repair documentation.",
          "Identify open questions instead of filling gaps from memory.",
        ],
      },
      {
        heading: "Address disclosures as a document project",
        paragraphs: [
          "New Jersey's current Seller's Property Condition Disclosure Statement asks detailed questions about the property and includes flood-risk information. NJDEP states that sellers must provide specified flood-risk disclosures before a purchaser becomes obligated under a purchase contract.",
          "For most housing built before 1978, federal rules also require disclosure of known lead-based paint information and available records before the contract is signed, along with the required lead information materials. Use the current forms supplied for the transaction and direct legal questions to an attorney.",
        ],
        checklist: [
          "Answer disclosure questions from actual knowledge and available records.",
          "Use NJDEP's flood-risk notification tool and the current state disclosure form.",
          "Locate lead-based paint reports and records for covered pre-1978 housing.",
        ],
      },
      {
        heading: "Choose repairs deliberately",
        paragraphs: [
          "Separate safety or active-maintenance concerns from ordinary wear and cosmetic preferences. Obtain qualified opinions where a condition is outside your knowledge, and keep estimates and completed-work documentation together.",
          "A repair may improve presentation without returning its full cost, while leaving a condition unresolved may affect buyer interest, inspections, negotiations, or insurability. Discuss the options and likely market response without relying on promised-return claims.",
        ],
        checklist: [
          "Resolve active leaks, unsafe conditions, and basic maintenance questions first.",
          "Use appropriately licensed or qualified contractors when the work requires it.",
          "Retain permits, invoices, warranties, and before-and-after documentation.",
        ],
      },
      {
        heading: "Prepare for pricing and launch decisions",
        paragraphs: [
          "A comparative market analysis should connect recent and competing properties to the subject property's location, condition, size, features, and timing. It is a decision aid, not a promise of a particular sale price or marketing period.",
          "Before launch, agree on showing instructions, included and excluded items, photography readiness, marketing channels, communication expectations, and how new information will be handled.",
        ],
        checklist: [
          "Review the reasoning behind the suggested price range.",
          "Decide which fixtures or personal-property items are included or excluded.",
          "Set a showing, communication, and offer-presentation plan.",
        ],
      },
      {
        heading: "Compare offers by risk as well as price",
        paragraphs: [
          "A higher headline price does not automatically produce the strongest net result. Review financing, deposit, appraisal and inspection provisions, requested credits, sale contingencies, closing timing, included property, and the evidence supporting the buyer's ability to perform.",
          "Ask for an estimated net sheet using the known terms, then confirm legal, tax, payoff, and settlement questions with the professionals responsible for those figures.",
        ],
        checklist: [
          "Compare estimated net proceeds rather than price alone.",
          "Review contingencies, deadlines, credits, and closing timing together.",
          "Document the accepted terms and maintain the transaction calendar through closing.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Flood Disclosure Law", href: "https://dep.nj.gov/flooddisclosure/", accessed: reviewedDate },
      { tag: "SOURCE", text: "New Jersey Office of the Attorney General — Seller's Property Condition Disclosure Statement", href: "https://www.nj.gov/oag/newsreleases23/2023-1220_SELLERS-PROPERTY-CONDITION-DISCLOSURE-STATEMENT.pdf", accessed: reviewedDate },
      { tag: "SOURCE", text: "U.S. Environmental Protection Agency — Lead-Based Paint Disclosure Rule", href: "https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x", accessed: reviewedDate },
    ],
    relatedLinks: [
      { label: "Read the buyer process guide", href: "/insights/new-jersey-homebuying-process" },
      { label: "Discuss selling a property", href: "/contact" },
    ],
  },
  "/insights/researching-a-south-jersey-property": {
    category: "Property research",
    eyebrow: "South Jersey research guide",
    notice: "Public databases and maps are screening tools, not surveys, title reports, legal opinions, inspections, environmental reports, or insurance determinations. Confirm important findings with the agency or qualified professional responsible for them.",
    publishedDate: reviewedDate,
    readingTime: "8 minute read",
    reviewedDate,
    summary: "A listing introduces a property. A careful buyer also checks the parcel, local records, land-use context, flood information, environmental data, and recurring ownership costs.",
    title: "Researching a South Jersey Property Beyond the Listing",
    sections: [
      {
        heading: "Confirm the parcel before comparing the facts",
        paragraphs: [
          "Start by matching the street address to the municipality, county, block and lot, and tax-record entry. New Jersey's Property Explorer includes parcel location, owner information, assessed land and improvement values, prior-year taxes, and property classification from the annual assessment lists.",
          "The state warns that changes occurring after the tax list is certified may not appear immediately. Treat the record as a starting point and verify ownership, boundaries, easements, and legal description through the appropriate title, survey, municipal, or county records.",
        ],
        checklist: [
          "Match the address, municipality, county, block, and lot.",
          "Note the assessment year and possible reporting lag.",
          "Do not treat a tax map as a boundary survey or title determination.",
        ],
      },
      {
        heading: "Check municipal land-use and construction records",
        paragraphs: [
          "Zoning, permitted uses, setbacks, accessory structures, rental rules, certificates, and permit histories are administered locally and can change. Use the municipality's official code, zoning map, tax assessor, construction office, and clerk as the controlling starting points.",
          "Ask focused questions tied to the parcel and your intended use. A neighboring use or an online map color does not establish what is permitted on the property you are considering.",
        ],
        checklist: [
          "Locate the official municipal zoning map and ordinance.",
          "Ask about open permits, approvals, violations, or required certificates.",
          "Verify a planned addition, rental, business, subdivision, or accessory use before relying on it.",
        ],
      },
      {
        heading: "Use both state and federal flood resources",
        paragraphs: [
          "NJDEP's Flood Risk Notification Tool helps identify state and FEMA flood-zone information used in New Jersey disclosures. FEMA's Map Service Center is the official public source for National Flood Insurance Program flood-hazard maps and related products.",
          "A map result is not the same as a property-specific insurance quote, elevation certificate, engineering analysis, or guarantee that flooding will or will not occur. Review the seller's disclosure, available elevation information and claims history, and obtain insurance guidance for the specific property.",
        ],
        checklist: [
          "Search the NJDEP flood notification tool by address.",
          "Check the effective FEMA map and any applicable revisions.",
          "Ask an insurance professional about availability, coverage, and cost before deadlines expire.",
        ],
      },
      {
        heading: "Screen environmental and regional constraints",
        paragraphs: [
          "NJ-GeoWeb allows the public to view and query NJDEP environmental map layers. Depending on the property, useful screening topics can include wetlands, regulated flood areas, known contaminated sites, preserved land, and other mapped resources.",
          "South Jersey also includes Pinelands, coastal, agricultural, and watershed areas where state, regional, county, or municipal rules may overlap. Map layers can identify questions to investigate; they do not by themselves determine permit applicability or development rights.",
        ],
        checklist: [
          "Review relevant NJ-GeoWeb layers and record the layer name and date.",
          "Check whether a regional or state agency may have jurisdiction.",
          "Direct development, contamination, wetlands, well, septic, or permit questions to qualified professionals and the responsible agencies.",
        ],
      },
      {
        heading: "Reconcile recurring costs with the property's condition",
        paragraphs: [
          "Combine the available tax information with insurance estimates, association charges, utilities, private well or septic responsibilities, maintenance needs, and anticipated capital work. Historical costs may not predict what a new owner will pay.",
          "Keep a short research log listing the source, date checked, open question, and person responsible for answering it. That makes it easier to distinguish verified records from assumptions as contract deadlines approach.",
        ],
        checklist: [
          "Request current tax, insurance, association, and utility information where available.",
          "Separate known recurring costs from estimates and possible future work.",
          "Track unresolved questions and the deadline for resolving each one.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "State of New Jersey Transparency Center — Property Tax and Property Explorer", href: "https://nj.gov/transparency/property/", accessed: reviewedDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Flood Disclosure Law and Mapping Tool", href: "https://dep.nj.gov/flooddisclosure/", accessed: reviewedDate },
      { tag: "SOURCE", text: "FEMA — Flood Map Service Center", href: "https://msc.fema.gov/", accessed: reviewedDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — NJ-GeoWeb", href: "https://dep.nj.gov/gis/nj-geoweb/", accessed: reviewedDate },
      { tag: "SOURCE", text: "New Jersey Department of Community Affairs — Zoning Map and Ordinance Directory", href: "https://www.nj.gov/dca/", accessed: reviewedDate },
    ],
    relatedLinks: [
      { label: "Explore South Jersey counties", href: "/counties" },
      { label: "Read the buyer process guide", href: "/insights/new-jersey-homebuying-process" },
    ],
  },
};
