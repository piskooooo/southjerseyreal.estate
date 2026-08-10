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
  author: string;
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

const originalLibraryDate = "2026-07-25";
const libraryReviewDate = "2026-08-10";
const newGuideDate = "2026-08-10";
const arthurByline = "Arthur Pisko Jr.";

export const insightIndex: InsightIndexContent = {
  eyebrow: "Evergreen real-estate guidance",
  title: "South Jersey Real Estate Guides",
  introduction: "Practical, sourced guides for buying, selling, and researching property. South Jersey is the focus, and Arthur works with clients throughout New Jersey. Each guide shows when its underlying information was last substantively reviewed.",
  articles: [
    {
      category: "Buying",
      href: "/insights/new-jersey-homebuying-process",
      reviewedDate: libraryReviewDate,
      summary: "A step-by-step view of readiness, representation, offers, due diligence, financing documents, and closing.",
      title: "A First Look at the New Jersey Homebuying Process",
    },
    {
      category: "Selling",
      href: "/insights/preparing-to-sell-a-new-jersey-home",
      reviewedDate: libraryReviewDate,
      summary: "A calm pre-listing checklist covering property records, required disclosures, repair planning, pricing discussions, and offer review.",
      title: "Preparing to Sell a New Jersey Home",
    },
    {
      category: "Property research",
      href: "/insights/researching-a-south-jersey-property",
      reviewedDate: libraryReviewDate,
      summary: "How to look beyond listing remarks by checking parcel data, municipal records, flood information, environmental maps, and recurring costs.",
      title: "Researching a South Jersey Property Beyond the Listing",
    },
    {
      category: "Buying and evaluating",
      href: "/insights/home-inspections-and-repair-questions",
      reviewedDate: newGuideDate,
      summary: "Use inspections and repair questions to test assumptions, organize findings, and make deliberate decisions within the contract timeline.",
      title: "Home Inspections and Repair Questions: A Buyer's Working Guide",
    },
    {
      category: "Buying and evaluating",
      href: "/insights/municipal-records-permits-and-zoning",
      reviewedDate: newGuideDate,
      summary: "A practical way to use municipal records, permits, certificates, zoning information, and official contacts in a home search.",
      title: "Using Municipal Records, Permits, and Zoning Information in a Home Search",
    },
    {
      category: "South Jersey considerations",
      href: "/insights/questions-before-choosing-a-community",
      reviewedDate: newGuideDate,
      summary: "A neutral framework for investigating a community's practical fit without rankings, labels, or one-size-fits-all recommendations.",
      title: "Questions to Investigate Before Choosing a South Jersey Community",
    },
    {
      category: "South Jersey considerations",
      href: "/insights/coastal-property-due-diligence",
      reviewedDate: newGuideDate,
      summary: "Understand the property-specific questions that flood, coastal, insurance, seasonal-use, and permit information should prompt.",
      title: "Coastal-Property Due Diligence in South Jersey",
    },
    {
      category: "South Jersey considerations",
      href: "/insights/wells-septic-acreage-and-environmental-constraints",
      reviewedDate: newGuideDate,
      summary: "A research guide for homes with private wells, septic systems, acreage, wetlands, Pinelands context, or other land-use questions.",
      title: "Homes with Wells, Septic Systems, Acreage, or Environmental Constraints",
    },
  ],
};

export const insightArticles: Record<string, InsightArticleContent> = {
  "/insights/new-jersey-homebuying-process": {
    author: arthurByline,
    category: "Buying",
    eyebrow: "New Jersey buyer guide",
    notice: "This guide is general educational information, not legal, tax, insurance, inspection, lending, or financial advice. A particular transaction may require guidance from the appropriate licensed professionals.",
    publishedDate: originalLibraryDate,
    readingTime: "8 minute read",
    reviewedDate: libraryReviewDate,
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
      { tag: "SOURCE", text: "Consumer Financial Protection Bureau — Your home loan toolkit", href: "https://www.consumerfinance.gov/owning-a-home/explore/home-loan-toolkit/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "New Jersey Department of Banking and Insurance — Real Estate Consumer Information", href: "https://www.nj.gov/dobi/division_consumers/realestate/re_menu.htm", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "Consumer Financial Protection Bureau — Review documents before closing", href: "https://www.consumerfinance.gov/owning-a-home/close/review-documents-before-closing/", accessed: libraryReviewDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Contact Arthur", href: "/contact" },
    ],
  },
  "/insights/preparing-to-sell-a-new-jersey-home": {
    author: arthurByline,
    category: "Selling",
    eyebrow: "New Jersey seller guide",
    notice: "This guide is general educational information, not legal, tax, inspection, environmental, or repair advice. Disclosure and transaction requirements can depend on the property and circumstances.",
    publishedDate: originalLibraryDate,
    readingTime: "7 minute read",
    reviewedDate: libraryReviewDate,
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
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Flood Disclosure Law", href: "https://dep.nj.gov/flooddisclosure/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "New Jersey Office of the Attorney General — Seller's Property Condition Disclosure Statement", href: "https://www.nj.gov/oag/newsreleases23/2023-1220_SELLERS-PROPERTY-CONDITION-DISCLOSURE-STATEMENT.pdf", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "U.S. Environmental Protection Agency — Lead-Based Paint Disclosure Rule", href: "https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x", accessed: libraryReviewDate },
    ],
    relatedLinks: [
      { label: "Read the buyer process guide", href: "/insights/new-jersey-homebuying-process" },
      { label: "Discuss selling a property", href: "/contact" },
    ],
  },
  "/insights/researching-a-south-jersey-property": {
    author: arthurByline,
    category: "Property research",
    eyebrow: "South Jersey research guide",
    notice: "Public databases and maps are screening tools, not surveys, title reports, legal opinions, inspections, environmental reports, or insurance determinations. Confirm important findings with the agency or qualified professional responsible for them.",
    publishedDate: originalLibraryDate,
    readingTime: "8 minute read",
    reviewedDate: libraryReviewDate,
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
      { tag: "SOURCE", text: "State of New Jersey Transparency Center — Property Tax and Property Explorer", href: "https://nj.gov/transparency/property/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Flood Disclosure Law and Mapping Tool", href: "https://dep.nj.gov/flooddisclosure/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "FEMA — Flood Map Service Center", href: "https://msc.fema.gov/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — NJ-GeoWeb", href: "https://dep.nj.gov/gis/nj-geoweb/", accessed: libraryReviewDate },
      { tag: "SOURCE", text: "New Jersey Department of Community Affairs — Zoning Map and Ordinance Directory", href: "https://www.nj.gov/dca/", accessed: libraryReviewDate },
    ],
    relatedLinks: [
      { label: "Explore South Jersey counties", href: "/counties" },
      { label: "Read the buyer process guide", href: "/insights/new-jersey-homebuying-process" },
    ],
  },
  "/insights/home-inspections-and-repair-questions": {
    author: arthurByline,
    category: "Buying and evaluating",
    eyebrow: "New Jersey buyer guide",
    notice: "This guide is general educational information, not inspection, engineering, environmental, legal, or repair advice. The right evaluation and response depend on the property, contract, findings, and qualified professionals involved.",
    publishedDate: newGuideDate,
    readingTime: "7 minute read",
    reviewedDate: newGuideDate,
    summary: "An inspection is a way to investigate a home's condition and organize decisions. It does not replace the other records, specialists, or deadlines that may apply to a purchase.",
    title: "Home Inspections and Repair Questions: A Buyer's Working Guide",
    sections: [
      {
        heading: "Decide what each inspection should answer",
        paragraphs: [
          "A general home inspection can help a buyer understand visible and accessible conditions, but it is not a warranty, code certification, appraisal, or prediction of every future repair. Read the inspector's scope before the appointment so you know what is included, excluded, and referred to another specialist.",
          "The property and available records may point to additional questions about systems, structure, pests, wells, septic, radon, lead, environmental conditions, pools, chimneys, or other features. Ask the qualified professional responsible for that field what information is needed before relying on a conclusion.",
        ],
        checklist: [
          "Read the inspection agreement and confirm the property address and scope.",
          "List known property features that may need a specialist review.",
          "Keep inspection, repair, and seller-provided documents together with the contract calendar.",
        ],
      },
      {
        heading: "Attend with questions, not a repair script",
        paragraphs: [
          "If attendance is permitted, use the walkthrough to understand locations, maintenance history, shutoffs, and questions the written report may answer. Avoid asking an inspector to make a transaction decision for you; their role is to report observations within the agreed scope.",
          "The written report is usually the durable record. Read it carefully, distinguish observations from recommendations, and ask for clarification where the report uses terms you do not understand. A photograph or short note may identify a concern without establishing its cause, cost, or remedy.",
        ],
        checklist: [
          "Bring a concise list of questions about systems and observed conditions.",
          "Ask how the report organizes safety, maintenance, and further-evaluation items.",
          "Request clarification from the inspector before assuming what a finding means.",
        ],
      },
      {
        heading: "Separate findings by decision and deadline",
        paragraphs: [
          "Sort findings into immediate safety concerns, active maintenance issues, ordinary aging, and items requiring a qualified opinion. This makes it easier to identify which questions affect your intended use, financing, insurance, budget, or contract rights.",
          "Do not let a long report erase the timeline. Inspection, attorney-review, financing, and other dates can be time-sensitive. Confirm the applicable deadlines with the professionals responsible for the transaction, then document what information is still needed before each decision point.",
        ],
        checklist: [
          "Record the finding, source, open question, and deadline in one working list.",
          "Obtain specialist opinions when a report identifies an issue outside the inspector's scope.",
          "Share the relevant records with your lender or insurer when their review is required.",
        ],
      },
      {
        heading: "Evaluate repair and credit choices on their actual terms",
        paragraphs: [
          "A repair request, credit, price change, or decision to proceed as-is can each carry different practical and contractual consequences. The right choice depends on evidence, timing, financing, insurance, and your own plan for the property—not on a generic rule about what a seller should do.",
          "When work is proposed, clarify who will perform it, what is included, whether permits or approvals may be needed, how completion will be documented, and how the agreement will be reflected in the transaction. Questions about contract language or legal consequences belong with a New Jersey attorney.",
        ],
        checklist: [
          "Compare proposed solutions with the actual inspection or specialist finding.",
          "Ask for appropriate invoices, permits, warranties, and completion documentation.",
          "Keep the negotiated outcome in writing and recheck agreed work before closing when appropriate.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "New Jersey Department of Banking and Insurance — Real Estate Consumer Information", href: "https://www.nj.gov/dobi/division_consumers/realestate/re_menu.htm", accessed: newGuideDate },
      { tag: "SOURCE", text: "U.S. Environmental Protection Agency — Lead-Based Paint Disclosure Rule", href: "https://www.epa.gov/lead/lead-based-paint-disclosure-rule-section-1018-title-x", accessed: newGuideDate },
      { tag: "SOURCE", text: "Consumer Financial Protection Bureau — Buying a house", href: "https://www.consumerfinance.gov/owning-a-home/", accessed: newGuideDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Read the New Jersey buyer guide", href: "/insights/new-jersey-homebuying-process" },
    ],
  },
  "/insights/municipal-records-permits-and-zoning": {
    author: arthurByline,
    category: "Buying and evaluating",
    eyebrow: "Property research guide",
    notice: "Municipal maps, codes, records, and staff responses are research tools, not title opinions, surveys, legal advice, or assurances that a use or project is approved. Confirm parcel-specific conclusions with the responsible office and qualified professionals.",
    publishedDate: newGuideDate,
    readingTime: "7 minute read",
    reviewedDate: newGuideDate,
    summary: "Municipal records can turn broad listing questions into focused parcel questions about permits, zoning, certificates, and intended uses.",
    title: "Using Municipal Records, Permits, and Zoning Information in a Home Search",
    sections: [
      {
        heading: "Start with the right municipality and parcel",
        paragraphs: [
          "A mailing address, neighborhood name, or online map pin is not always enough to identify the office that controls a record. Confirm the municipality, county, block, lot, and street address before comparing tax, zoning, permit, or certificate information.",
          "New Jersey's municipal and zoning directories are useful starting points for finding an official website, map, ordinance, or contact. The local office remains the appropriate source for a question about a particular property.",
        ],
        checklist: [
          "Match the listing address to the municipality, county, block, and lot.",
          "Save the official municipal website and the date you checked it.",
          "Use the parcel identifiers in each request or follow-up question.",
        ],
      },
      {
        heading: "Read zoning information as a prompt for questions",
        paragraphs: [
          "A zoning map identifies a district; it does not by itself establish every permitted use, dimension, approval, or nonconforming status for a parcel. Read the applicable ordinance and ask the zoning office focused questions about the use or project you are considering.",
          "This is especially important before relying on plans for an addition, accessory dwelling, home business, rental, subdivision, livestock, parking change, or other use. A nearby property's appearance or an online summary is not a determination for the property you are evaluating.",
        ],
        checklist: [
          "Locate the district on the official map and the matching ordinance section.",
          "Describe the intended use or project clearly when contacting the municipality.",
          "Ask what approvals, records, or professionals may be needed before proceeding.",
        ],
      },
      {
        heading: "Ask focused permit and certificate questions",
        paragraphs: [
          "Permit history and certificates can help identify questions about construction, alterations, occupancy, inspections, or open work. Availability, terminology, and retention practices vary by municipality, so ask what the office can confirm and whether additional records should be requested.",
          "A missing online record does not prove that work was unpermitted, completed, or acceptable. Compare municipal responses with seller-provided permits, invoices, plans, inspections, and the property's visible condition, then seek qualified guidance when the evidence does not align.",
        ],
        checklist: [
          "Ask about open permits, final inspections, certificates, and known violations.",
          "Compare record dates and descriptions against seller-provided documentation.",
          "Keep copies of requests and responses in the property research file.",
        ],
      },
      {
        heading: "Keep local research connected to the transaction",
        paragraphs: [
          "Municipal information is one part of broader due diligence. It should be considered alongside title, survey, inspection, association, flood, environmental, insurance, and financing questions where applicable.",
          "A short log can prevent important questions from disappearing between appointments. Note the source, date checked, person or office contacted, answer received, follow-up needed, and the deadline that makes the question material.",
        ],
        checklist: [
          "Separate confirmed records from assumptions and unanswered questions.",
          "Share time-sensitive material with the appropriate transaction professional.",
          "Recheck any material answer that was informal or not tied to the exact parcel.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "New Jersey Department of Community Affairs — Zoning Map and Ordinance Directory", href: "https://www.nj.gov/dca/", accessed: newGuideDate },
      { tag: "SOURCE", text: "State of New Jersey — New Jersey Municipalities directory", href: "https://www.nj.gov/infobank/revmuni.htm", accessed: newGuideDate },
      { tag: "SOURCE", text: "State of New Jersey Transparency Center — Property Tax and Property Explorer", href: "https://nj.gov/transparency/property/", accessed: newGuideDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Explore South Jersey counties", href: "/counties" },
    ],
  },
  "/insights/questions-before-choosing-a-community": {
    author: arthurByline,
    category: "South Jersey considerations",
    eyebrow: "South Jersey research guide",
    notice: "A community can fit one household differently from another. This guide is a neutral research framework, not a ranking, recommendation, prediction, or statement about any protected class.",
    publishedDate: newGuideDate,
    readingTime: "6 minute read",
    reviewedDate: newGuideDate,
    summary: "Use repeatable, firsthand questions to compare the communities and property settings that interest you without reducing a decision to a label or ranking.",
    title: "Questions to Investigate Before Choosing a South Jersey Community",
    sections: [
      {
        heading: "Begin with your own day-to-day requirements",
        paragraphs: [
          "Write down the practical needs that will shape the search: the places you need to reach, the times you travel, property type, lot and maintenance preferences, budget boundaries, accessibility needs, and the activities that matter to you. This creates a useful research filter without assuming that the same place suits every household.",
          "Then compare each property and community against the same list. A town name alone cannot tell you how a particular street, block, building, or parcel will fit your routine.",
        ],
        checklist: [
          "List the non-negotiable daily trips and the times they occur.",
          "Identify property-setting preferences, such as density, outdoor space, or maintenance responsibility.",
          "Separate personal priorities from information that needs official verification.",
        ],
      },
      {
        heading: "Visit at more than one useful time",
        paragraphs: [
          "A daytime showing is only one observation. When appropriate, return at times that reflect your likely routine and observe the approach to the property, parking, noise, lighting, traffic patterns, nearby land uses, and the condition of areas you would use.",
          "Observation does not replace official records or a professional evaluation. It helps you form better questions for municipal offices, associations, inspectors, insurers, and the seller's available documents.",
        ],
        checklist: [
          "Visit the route to and from the property at a relevant time.",
          "Observe the property setting from public areas without disturbing neighbors.",
          "Record questions rather than drawing conclusions from a single visit.",
        ],
      },
      {
        heading: "Check the local sources that control practical details",
        paragraphs: [
          "Use the county and municipal pages as gateways to official local contacts, meetings, notices, codes, services, and maps. Check the municipality rather than a third-party summary for items such as permits, local rules, public works, utilities, and planned use questions.",
          "For a condominium, townhome, cooperative, or other common-interest property, the association documents and professionals responsible for the transaction may answer as much about daily ownership as the municipality does.",
        ],
        checklist: [
          "Save the official county and municipal pages for each place under consideration.",
          "Identify which questions belong to the municipality, association, seller, or a professional.",
          "Review property-specific records rather than relying on a community-wide generalization.",
        ],
      },
      {
        heading: "Keep comparison notes fair and useful",
        paragraphs: [
          "Use the same questions for every community so one attractive feature does not hide a material concern elsewhere. A simple comparison sheet can track verified facts, personal observations, unknowns, and the source for each entry.",
          "Avoid treating a reputation, ranking, or broad label as a substitute for research. The goal is a decision that reflects the property and your own requirements, supported by current information from the responsible sources.",
        ],
        checklist: [
          "Record source and access date beside each verified fact.",
          "Mark open questions and the deadline for resolving them.",
          "Revisit your priorities before deciding that a property is the right fit.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "State of New Jersey — New Jersey Municipalities directory", href: "https://www.nj.gov/infobank/revmuni.htm", accessed: newGuideDate },
      { tag: "SOURCE", text: "New Jersey Department of Community Affairs", href: "https://www.nj.gov/dca/", accessed: newGuideDate },
      { tag: "SOURCE", text: "State of New Jersey Transparency Center — Property Tax and Property Explorer", href: "https://nj.gov/transparency/property/", accessed: newGuideDate },
    ],
    relatedLinks: [
      { label: "Explore South Jersey counties", href: "/counties" },
      { label: "Use the property research guide", href: "/insights/researching-a-south-jersey-property" },
    ],
  },
  "/insights/coastal-property-due-diligence": {
    author: arthurByline,
    category: "South Jersey considerations",
    eyebrow: "South Jersey coastal guide",
    notice: "Flood maps, coastal maps, disclosures, and public records are screening tools. They do not determine insurance availability or cost, elevation, engineering needs, title, permit status, or future conditions for a particular property.",
    publishedDate: newGuideDate,
    readingTime: "8 minute read",
    reviewedDate: newGuideDate,
    summary: "Coastal and shore-area properties deserve property-specific flood, insurance, permitting, condition, and intended-use questions before deadlines pass.",
    title: "Coastal-Property Due Diligence in South Jersey",
    sections: [
      {
        heading: "Start with the exact property, not a broad shore label",
        paragraphs: [
          "A coastal location can involve ocean, bay, river, back-bay, tidal, mainland, or barrier-island conditions that differ from one parcel to the next. Begin by matching the address to its municipality, block and lot, maps, seller disclosure, and the property's actual construction and access.",
          "A neighborhood description or a prior owner's experience cannot establish current flood, insurance, elevation, or permit information. Use it only as a prompt for property-specific questions.",
        ],
        checklist: [
          "Confirm the municipality, block, lot, and legal property description.",
          "Collect available elevation, survey, disclosure, and prior-work documents.",
          "Separate verified property records from informal descriptions.",
        ],
      },
      {
        heading: "Use flood resources without overreading them",
        paragraphs: [
          "NJDEP's flood resources and FEMA's Map Service Center can identify mapped flood-hazard information and questions for further review. Check the effective map, available revisions, seller disclosures, and other property records rather than relying on a single map result.",
          "Mapped information is not an insurance quote or a guarantee that flooding will or will not occur. Ask an insurance professional about coverage, exclusions, availability, documentation, and cost for the specific property before applicable deadlines.",
        ],
        checklist: [
          "Search both the NJDEP tool and FEMA's effective map resources.",
          "Ask for available elevation and flood-related documents.",
          "Obtain property-specific insurance guidance early in the process.",
        ],
      },
      {
        heading: "Investigate repairs, improvements, and future plans",
        paragraphs: [
          "Bulkheads, docks, decks, dunes, mechanical equipment, additions, reconstruction, and other work can raise municipal, coastal, flood-hazard, wetlands, tidelands, or permit questions. The relevant jurisdiction depends on the exact location and work, not on a general description of the area.",
          "Ask for permits, approvals, plans, invoices, warranties, and final inspections where available. If you are considering work after closing, contact the responsible municipal and state offices before assuming it can be completed in the way, size, or timing you expect.",
        ],
        checklist: [
          "Compare visible improvements with available permits and records.",
          "Ask whether coastal or other state jurisdiction may apply to intended work.",
          "Retain written answers and identify any professional evaluation required.",
        ],
      },
      {
        heading: "Match the ownership plan to the property's realities",
        paragraphs: [
          "Seasonal use, rental plans, association rules, maintenance responsibilities, access, utilities, and storm preparation can all affect how a property functions. Verify local and association rules directly before relying on a potential use or income assumption.",
          "Build a property-specific file that combines recurring costs, condition, documents, risk questions, and deadlines. That record supports a more careful decision than any broad claim about the shore market.",
        ],
        checklist: [
          "Review association and municipal rules for the intended use.",
          "List maintenance, insurance, utility, access, and seasonal-preparation questions.",
          "Track unresolved property-specific questions through closing.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Flood Disclosure Law and Mapping Tool", href: "https://dep.nj.gov/flooddisclosure/", accessed: newGuideDate },
      { tag: "SOURCE", text: "FEMA — Flood Map Service Center", href: "https://msc.fema.gov/", accessed: newGuideDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — The Coastal Zone", href: "https://dep.nj.gov/wlm/lrp/coastal-zone/", accessed: newGuideDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Explore Atlantic and Cape May counties", href: "/counties" },
    ],
  },
  "/insights/wells-septic-acreage-and-environmental-constraints": {
    author: arthurByline,
    category: "South Jersey considerations",
    eyebrow: "South Jersey land and systems guide",
    notice: "This guide is general educational information, not well, septic, environmental, engineering, survey, legal, land-use, or insurance advice. Conditions and requirements can vary materially by parcel and intended use.",
    publishedDate: newGuideDate,
    readingTime: "8 minute read",
    reviewedDate: newGuideDate,
    summary: "Rural and lower-density properties can involve private systems, land features, and regulations that deserve a separate, property-specific due-diligence plan.",
    title: "Homes with Wells, Septic Systems, Acreage, or Environmental Constraints",
    sections: [
      {
        heading: "Identify the systems and land features early",
        paragraphs: [
          "Start with the property's actual water, wastewater, heating, access, drainage, and land-use arrangement. Ask for available well and septic records, maintenance history, permits, surveys, maps, easements, and documentation for improvements or agricultural uses.",
          "A larger lot does not automatically create flexibility for an addition, outbuilding, animal, business, subdivision, or other project. Intended use should be investigated with the municipality and any relevant regional or state authority before it becomes an assumption in the purchase.",
        ],
        checklist: [
          "List each private system, land feature, and intended future use.",
          "Request available plans, permits, service records, and survey information.",
          "Confirm which office or professional can answer each property-specific question.",
        ],
      },
      {
        heading: "Treat private wells as a water-quality question",
        paragraphs: [
          "New Jersey's Private Well Testing Act establishes consumer-information requirements for certain property sales and leases involving potable wells. Review the actual untreated-water test results, their date, the laboratory information, and any treatment system rather than relying on a general statement about water quality in an area.",
          "The test record does not replace a discussion of the well's location, construction, capacity, maintenance, treatment, or the questions raised by a result. Direct interpretation and remediation questions to qualified professionals and the responsible health or environmental authorities.",
        ],
        checklist: [
          "Obtain and review the applicable private-well test results before closing.",
          "Ask about treatment equipment, maintenance, and supporting records.",
          "Confirm who can answer follow-up questions about a result or system condition.",
        ],
      },
      {
        heading: "Give septic systems their own inspection plan",
        paragraphs: [
          "A septic system's current function, maintenance, location, and capacity for future plans can be material to a purchase. NJDEP homeowner guidance recommends a septic inspection for purchasers and explains that system condition may affect planned construction or long-term use.",
          "A general home inspection may identify questions but does not substitute for a septic inspection or other qualified evaluation when the property and transaction call for one. Keep any report, location information, pumping records, and repair estimate tied to the contract timeline.",
        ],
        checklist: [
          "Ask for septic location, maintenance, pumping, permit, and inspection records.",
          "Arrange qualified evaluation when appropriate to the property and contract.",
          "Check whether a future addition or improvement changes the system question.",
        ],
      },
      {
        heading: "Screen land-use and environmental questions without assuming the answer",
        paragraphs: [
          "Wetlands, flood areas, preserved land, Pinelands context, agricultural restrictions, easements, and other mapped resources can affect a project's questions and approvals. Use official mapping and planning resources to identify what needs further investigation, not to make a final determination yourself.",
          "For properties in or near the Pinelands or other regulated areas, review the responsible agency's current resources and contact the appropriate office before relying on development potential. Title, survey, engineering, legal, and permit questions each require their own competent source.",
        ],
        checklist: [
          "Screen relevant official map layers and record the date and layer used.",
          "Ask whether a proposed use may need municipal, county, regional, or state review.",
          "Keep mapped screening results separate from final permits or professional opinions.",
        ],
      },
    ],
    sources: [
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Private Well Testing Act", href: "https://dep.nj.gov/privatewells/pwta/", accessed: newGuideDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — Septic System Homeowner Guidance", href: "https://dep.nj.gov/dwq/wastewater/septic-systems/homeowner-guidance/", accessed: newGuideDate },
      { tag: "SOURCE", text: "New Jersey Pinelands Commission — Comprehensive Management Plan", href: "https://www.nj.gov/pinelands/cmp/CMP.pdf", accessed: newGuideDate },
      { tag: "SOURCE", text: "New Jersey Department of Environmental Protection — NJ-GeoWeb", href: "https://dep.nj.gov/gis/nj-geoweb/", accessed: newGuideDate },
    ],
    relatedLinks: [
      { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
      { label: "Read the municipal records guide", href: "/insights/municipal-records-permits-and-zoning" },
    ],
  },
};
