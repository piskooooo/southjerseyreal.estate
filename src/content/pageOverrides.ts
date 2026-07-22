import {
  compliance,
  operatorDisclosureText,
} from "./compliance";
import { countyNav } from "./navigation";
import type { ContentBlock, SitePage } from "./types";

const actionBlocks: ContentBlock[] = [
  { tag: "H2", text: "Have a real estate question?" },
  {
    tag: "P",
    text: "Get in touch about a property, a move, or the market.",
  },
  { tag: "A", text: "Contact", href: "/contact" },
];

const actionSection = (id: string) => ({
  id,
  kind: "action" as const,
  blocks: actionBlocks.map((block) => ({ ...block })),
  images: [],
});

const countyHubImages: Record<string, { src: string; alt: string }> = {
  "/atlantic-county": { src: "/assets/live/atlantic-county-map-png.webp", alt: "Atlantic County, New Jersey locator map." },
  "/burlington-county": { src: "/assets/live/burlington-county-map-png.webp", alt: "Burlington County, New Jersey locator map." },
  "/camden-county": { src: "/assets/live/camden-county-map-png.webp", alt: "Camden County, New Jersey locator map." },
  "/cape-may-county": { src: "/assets/live/cape-may-county-map-png.webp", alt: "Cape May County, New Jersey locator map." },
  "/cumberland-county": { src: "/assets/live/cumberland-county-map-png.webp", alt: "Cumberland County, New Jersey locator map." },
  "/gloucester-county": { src: "/assets/live/gloucester-county-map-png.webp", alt: "Gloucester County, New Jersey locator map." },
  "/salem-county": { src: "/assets/live/salem-county-map-png.webp", alt: "Salem County, New Jersey locator map." },
};

const countyHubSections = countyNav.map((county) => ({
  id: `counties-${county.label.toLowerCase().replace(/\s+/g, "-")}`,
  kind: "support" as const,
  blocks: [
    { tag: "H2", text: `${county.label} County` },
    {
      tag: "P",
      text: `Explore towns, cities, and local real estate information across ${county.label} County.`,
    },
    { tag: "A", text: `Explore ${county.label} County`, href: county.path },
  ],
  images: [{ ...countyHubImages[county.path] }],
}));

const connectHubSections = [
  {
    id: "connect-about",
    title: "About Arthur",
    description: "Meet the New Jersey real estate professional who owns and maintains this website.",
    label: "About Arthur",
    href: "/about",
  },
  {
    id: "connect-contact",
    title: "Contact",
    description: "Use the contact form for a property or real estate question.",
    label: "Get in Touch",
    href: "/contact",
  },
  {
    id: "connect-newsletter",
    title: "Newsletter",
    description: "Get useful South Jersey market notes, town updates, and buyer and seller tips by email.",
    label: "View the Newsletter",
    href: "/newsletter",
  },
  {
    id: "connect-why-new-jersey",
    title: "Why New Jersey?",
    description: "Compare practical differences between New Jersey and nearby states, from property records to regional travel.",
    label: "Explore New Jersey",
    href: "/why-new-jersey",
  },
  {
    id: "connect-why-south-jersey",
    title: "Why South Jersey?",
    description: "See how North and South Jersey differ as broad regions, then compare the places that interest you.",
    label: "Compare North and South Jersey",
    href: "/why-south-jersey",
  },
  {
    id: "connect-faq",
    title: "Frequently Asked Questions",
    description: "Find quick answers about the website, real estate inquiries, the newsletter, local providers, and advertising.",
    label: "Read the FAQ",
    href: "/faq",
  },
  {
    id: "connect-providers",
    title: "Real Estate Providers",
    description: "Browse the unpaid directory of mortgage, title, and other transaction-related providers.",
    label: "Browse Real Estate Providers",
    href: "/partners",
  },
  {
    id: "connect-advertise",
    title: "Advertise a Local Business",
    description: "Explore paid placements for South Jersey businesses outside the real estate transaction.",
    label: "View Local Advertising",
    href: "/advertise",
  },
].map((item) => ({
  id: item.id,
  kind: "support" as const,
  blocks: [
    { tag: "H2", text: item.title },
    { tag: "P", text: item.description },
    { tag: "A", text: item.label, href: item.href },
  ],
  images: [],
}));

export const pageOverrides: SitePage[] = [
  {
    path: "/",
    title: "South Jersey Real Estate",
    sections: [
      {
        id: "home-hero",
        blocks: [
          { tag: "H1", text: "South Jersey Real Estate" },
          {
            tag: "P",
            text: "Welcome to South Jersey Real Estate, a hub for real estate and local information throughout South Jersey. Use the county menu to explore each part of the region.",
          },
        ],
        images: [
          {
            src: "/assets/live/philly-skyline-from-camden-city-camden-jpg.webp",
            alt: "Philadelphia skyline viewed from South Jersey beyond trees and nearby homes.",
          },
        ],
      },
      {
        id: "home-about",
        blocks: [
          { tag: "H2", text: "South Jersey" },
          {
            tag: "P",
            text: "From Delaware River towns and established suburbs to farmland, the Pine Barrens, Delaware Bay, and the Atlantic shore, South Jersey changes considerably from county to county.",
          },
          {
            tag: "P",
            text: "Explore local real estate, housing snapshots, schools, parks, transportation, shopping, dining, and the character of communities throughout the region.",
          },
          { tag: "A", text: "Explore Counties", href: "/counties" },
        ],
        images: [
          {
            src: "/assets/live/pitman-gloucester-jpg.webp",
            alt: "Brick storefronts, cars, traffic lights, and motorcycles along a South Jersey commercial street.",
          },
        ],
      },
      actionSection("home-action"),
    ],
  },
  {
    path: "/counties",
    title: "South Jersey Counties",
    sections: [
      {
        id: "counties-intro",
        kind: "intro",
        blocks: [
          { tag: "H1", text: "South Jersey Counties" },
          {
            tag: "P",
            text: "Choose one of seven counties, then browse its towns, cities, and detailed local information.",
          },
        ],
        images: [],
      },
      ...countyHubSections,
      actionSection("counties-action"),
    ],
  },
  {
    path: "/connect",
    title: "Connect and Explore",
    sections: [
      {
        id: "connect-intro",
        kind: "intro",
        blocks: [
          { tag: "H1", text: "Connect and Explore" },
          {
            tag: "P",
            text: "Find community comparisons, the newsletter, contact information, and additional South Jersey resources.",
          },
        ],
        images: [],
      },
      ...connectHubSections,
    ],
  },
  {
    path: "/about",
    title: `About ${compliance.agentLicensedName}`,
    sections: [
      {
        id: "about-profile",
        blocks: [
          { tag: "H1", text: `About ${compliance.agentLicensedName}` },
          {
            tag: "P",
            text: `I'm a REALTOR® and ${compliance.agentLicenseType} affiliated with ${compliance.brokerLegalName}.`,
          },
          {
            tag: "P",
            text: "I created South Jersey Real Estate to organize local real estate and community information county by county in a region that is far too varied to describe as one market.",
          },
          { tag: "A", text: "Contact", href: "/contact" },
          { tag: "H3", text: "Local roots" },
          {
            tag: "P",
            text: "I was born in Stratford and raised in Deptford Township. Those local roots are what first made me interested in how South Jersey's towns, shore communities, farmland, and older boroughs fit together.",
          },
          { tag: "H3", text: "Real estate practice" },
          {
            tag: "P",
            text: "I work with residential buyers and sellers throughout New Jersey. My role is to explain the process clearly, keep the moving pieces organized, and help clients make their own informed decisions.",
          },
          { tag: "H3", text: "Credentials" },
          {
            tag: "P",
            text: `${compliance.agentLicensedName}, REALTOR®, ${compliance.agentLicenseType}, NJ Real Estate License #${compliance.agentLicenseNumber}.`,
          },
          { tag: "H3", text: "Contact" },
          {
            tag: "P",
            text: `Call or text ${compliance.agentPhone}, or email ${compliance.agentEmail}.`,
          },
          {
            tag: "P",
            text: "Find Arthur on Instagram, Facebook, Google Business Page, and Zillow.",
          },
          { tag: "H2", text: "Why this site exists" },
          {
            tag: "P",
            text: "South Jersey has river towns, Pine Barrens communities, suburban corridors, agricultural areas, and shore markets that work very differently from one another. This site is a place to explore those differences before narrowing the research to a particular property.",
          },
          { tag: "H2", text: "For buyers and sellers" },
          {
            tag: "P",
            text: "I help buyers define their search, review available property information, arrange showings, prepare offers, and follow transaction milestones. I help sellers prepare for market, review pricing and marketing options, evaluate offers, and coordinate the path toward closing.",
          },
          { tag: "H2", text: "How I work" },
          {
            tag: "P",
            text: "Clear explanations, responsive communication, and careful attention to the practical details of a New Jersey residential real estate transaction.",
          },
        ],
        images: [
          {
            src: "/assets/live/arthur-pisko-jr-picture-jpg.webp",
            alt: "Portrait of Arthur Pisko Jr. wearing glasses, a black shirt, and a plaid tie against a plain background.",
          },
        ],
      },
      {
        id: "about-reviews",
        kind: "promo",
        blocks: [
          { tag: "H2", text: "Client feedback" },
          {
            tag: "P",
            text: "Read public client feedback, with each review linked to its original source.",
          },
        ],
        images: [],
      },
      actionSection("about-action"),
    ],
  },
  {
    path: "/contact",
    title: `Contact ${compliance.agentLicensedName}`,
    sections: [
      {
        id: "contact-intro",
        blocks: [
          { tag: "H1", text: "Contact" },
          {
            tag: "P",
            text: "Use the form to ask about buying, selling, a property, or the New Jersey real estate market.",
          },
          {
            tag: "P",
            text: "Share as much or as little detail as you have, including your timing and any locations or properties already on your mind.",
          },
          {
            tag: "P",
            text: `Prefer to reach out directly? Call or text ${compliance.agentPhone}, or email ${compliance.agentEmail}.`,
          },
        ],
        images: [],
      },
      {
        id: "contact-resources",
        blocks: [
          { tag: "H3", text: "Real Estate Providers" },
          {
            tag: "P",
            text: "Browse the unpaid directory of lenders, title companies, and other transaction-related providers.",
          },
          { tag: "A", text: "Browse Real Estate Providers", href: "/partners" },
          { tag: "H3", text: "Advertise a Local Business" },
          {
            tag: "P",
            text: "Explore paid placements for local businesses outside the real estate transaction.",
          },
          { tag: "A", text: "View Local Advertising", href: "/advertise" },
        ],
        images: [],
      },
    ],
  },
  {
    path: "/partners",
    title: "Real Estate Provider Directory",
    sections: [actionSection("partners-action")],
  },
  {
    path: "/advertise",
    title: "Advertise a Local Business",
    sections: [actionSection("advertise-action")],
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy",
    sections: [
      {
        id: "privacy-policy",
        blocks: [
          { tag: "H1", text: "Privacy Policy" },
          { tag: "P", text: "Last updated: July 19, 2026" },
          { tag: "P", text: operatorDisclosureText },
          { tag: "H2", text: "Information collected" },
          {
            tag: "P",
            text: "The contact form collects the name, email address, phone number, inquiry topic, message, source page, and delivery metadata you submit. The newsletter form collects the email address and any optional name, county, and topic preferences you submit.",
          },
          {
            tag: "P",
            text: "Cloudflare Turnstile and short-lived HMAC-only rate-limit records are used to reduce automated abuse. Raw visitor IP addresses are not stored in the website's form database.",
          },
          { tag: "H2", text: "How information is used" },
          {
            tag: "P",
            text: "Submitted information is used to respond to inquiries, deliver requested real-estate information, operate newsletter double opt-in, prevent abuse, maintain records, and comply with applicable legal and brokerage obligations.",
          },
          { tag: "H2", text: "Service providers" },
          {
            tag: "P",
            text: "Cloudflare hosts and protects the website. Supabase processes and stores private form records. Brevo delivers contact notifications and newsletter double opt-in email. Google Analytics measures website use only after analytics consent is accepted. Information may also be shared with the affiliated brokerage or a transaction-related provider when needed to respond to a request.",
          },
          {
            tag: "P",
            text: "Google Maps Platform supplies public Google review content on the About page. When that section loads, review data and reviewer profile images may be requested from Google. Google's handling of information is described in the Google Privacy Policy.",
          },
          { tag: "H2", text: "Cookies and analytics choices" },
          {
            tag: "P",
            text: "Necessary security and preference storage supports the website. Google Analytics is optional and is not loaded until Analytics is accepted. The choice can be changed at any time through Cookie Settings in the footer. This site does not currently load advertising, retargeting, session-replay, or heatmap scripts.",
          },
          { tag: "H2", text: "Retention and security" },
          {
            tag: "P",
            text: "Private website copies of contact inquiries and the email-hash-only newsletter request ledger are scheduled for deletion 12 months after submission. Email and confirmed subscription records may be retained until no longer needed, the subscriber unsubscribes, or a longer period is required for legal, brokerage, dispute-resolution, or legitimate business purposes.",
          },
          { tag: "H2", text: "Privacy requests" },
          {
            tag: "P",
            text: `To ask about personal information submitted through this site, email ${compliance.agentEmail}. Licensed brokerage office: ${compliance.licensedOfficePhone}. Applicable privacy rights and exceptions depend on the law and circumstances.`,
          },
          { tag: "H2", text: "Children" },
          {
            tag: "P",
            text: "This website is not directed to children under 13 and does not knowingly collect personal information from children through its public forms.",
          },
          { tag: "H2", text: "Policy changes" },
          {
            tag: "P",
            text: "Material policy changes will be posted on this page with a revised effective date.",
          },
        ],
        images: [],
      },
    ],
  },
  {
    path: "/disclaimer",
    title: "Disclaimer",
    sections: [
      {
        id: "disclaimer",
        blocks: [
          { tag: "H1", text: "Disclaimer" },
          { tag: "P", text: "Last updated: July 18, 2026" },
          { tag: "P", text: operatorDisclosureText },
          { tag: "H2", text: "General information" },
          {
            tag: "P",
            text: "Website content is general information and is not legal, tax, lending, appraisal, inspection, insurance, or investment advice. Consult an appropriately qualified professional for advice about a specific situation.",
          },
          { tag: "H2", text: "Independent verification" },
          {
            tag: "P",
            text: "Community, market, tax, school, flood, insurance, transportation, amenity, and future listing information can change. Verify information material to a real-estate decision with current official or professional sources.",
          },
          { tag: "H2", text: "No agency relationship" },
          {
            tag: "P",
            text: "Using this website or contacting Arthur does not create an agency relationship, brokerage-services agreement, attorney-client relationship, or fiduciary relationship. Representation begins only through an appropriate written agreement.",
          },
          { tag: "H2", text: "Providers, advertising, and third-party links" },
          {
            tag: "P",
            text: "You are free to choose any provider. Directory inclusion, advertising, or a third-party link is not a guarantee or warranty of services. Paid placements are labeled Paid advertisement, and any additional material relationship is disclosed with the relevant entry.",
          },
          { tag: "H2", text: "Fair housing" },
          {
            tag: "P",
            text: `${compliance.brokerLegalName} and its affiliated licensees provide housing-related services without discrimination based on any characteristic protected by federal, New Jersey, or applicable local law, including race, color, creed or religion, national origin, nationality, ancestry, pregnancy or breastfeeding, sex, gender identity or expression, affectional or sexual orientation, familial status, disability, liability for service in the Armed Forces of the United States, marital status, civil union status, domestic partnership status, or source of lawful income used for rental or mortgage payments.`,
          },
        ],
        images: [],
      },
    ],
  },
  {
    path: "/terms-of-service",
    title: "Terms of Service",
    sections: [
      {
        id: "terms-of-service",
        blocks: [
          { tag: "H1", text: "Terms of Service" },
          { tag: "P", text: "Last updated: July 19, 2026" },
          { tag: "P", text: operatorDisclosureText },
          { tag: "H2", text: "Use of the website" },
          {
            tag: "P",
            text: "Use this website only for lawful informational, inquiry, subscription, provider-directory, and advertising purposes. Do not interfere with its operation or attempt unauthorized access.",
          },
          { tag: "H2", text: "Content and third-party links" },
          {
            tag: "P",
            text: "Website content may not be copied or redistributed except as permitted by law or with permission from the applicable owner. External websites have their own terms, content, and privacy practices.",
          },
          {
            tag: "P",
            text: "Google review content displayed on the About page is provided through Google Maps Platform and remains subject to the Google Maps Platform Terms of Service and Google Privacy Policy. The website may show a clearly disclosed selection of 4- and 5-star reviews while linking visitors to the complete Google review profile.",
          },
          { tag: "H2", text: "Accuracy and professional advice" },
          {
            tag: "P",
            text: "Information is general, can change, and must be independently verified. It is not legal, tax, lending, appraisal, inspection, insurance, or investment advice.",
          },
          { tag: "H2", text: "No agency relationship" },
          {
            tag: "P",
            text: "Submitting a form, calling, texting, emailing, or subscribing does not create an agency relationship or brokerage-services agreement. An appropriate written agreement is required for representation.",
          },
          { tag: "H2", text: "Changes" },
          {
            tag: "P",
            text: "Updates will be posted on this page with a revised effective date.",
          },
          { tag: "H2", text: "Contact" },
          {
            tag: "P",
            text: `Questions may be sent to ${compliance.agentEmail}. Licensed brokerage office: ${compliance.licensedOfficePhone}.`,
          },
        ],
        images: [],
      },
    ],
  },
];
