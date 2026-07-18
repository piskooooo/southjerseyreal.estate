import {
  compliance,
  operatorDisclosureText,
} from "./compliance";
import { countyNav } from "./navigation";
import type { ContentBlock, SitePage } from "./types";

const actionBlocks: ContentBlock[] = [
  { tag: "H2", text: "Planning a move in New Jersey?" },
  {
    tag: "P",
    text: "Arthur helps New Jersey buyers and sellers plan, communicate, and manage the steps of a real-estate transaction across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
  },
  { tag: "A", text: "Start the Conversation", href: "/contact" },
];

const actionSection = (id: string) => ({
  id,
  kind: "action" as const,
  blocks: actionBlocks.map((block) => ({ ...block })),
  images: [],
});

const countyHubImages: Record<string, { src: string; alt: string }> = {
  "/atlantic-county": { src: "/assets/live/atlantic-county-map-png.png", alt: "Atlantic County, New Jersey locator map." },
  "/burlington-county": { src: "/assets/live/burlington-county-map-png.png", alt: "Burlington County, New Jersey locator map." },
  "/camden-county": { src: "/assets/live/camden-county-map-png.png", alt: "Camden County, New Jersey locator map." },
  "/cape-may-county": { src: "/assets/live/cape-may-county-map-png.png", alt: "Cape May County, New Jersey locator map." },
  "/cumberland-county": { src: "/assets/live/cumberland-county-map-png.png", alt: "Cumberland County, New Jersey locator map." },
  "/gloucester-county": { src: "/assets/live/gloucester-county-map-png.png", alt: "Gloucester County, New Jersey locator map." },
  "/salem-county": { src: "/assets/live/salem-county-map-png.png", alt: "Salem County, New Jersey locator map." },
};

const countyHubSections = countyNav.map((county) => ({
  id: `counties-${county.label.toLowerCase().replace(/\s+/g, "-")}`,
  kind: "support" as const,
  blocks: [
    { tag: "H2", text: `${county.label} County` },
    {
      tag: "P",
      text: `Browse the ${county.label} County municipality directory and general information-verification guidance.`,
    },
    { tag: "A", text: `Open ${county.label} County Guide`, href: county.path },
  ],
  images: [{ ...countyHubImages[county.path] }],
}));

const connectHubSections = [
  {
    id: "connect-about",
    title: "About the Site Operator",
    description: `Read about ${compliance.agentLicensedName}, New Jersey Real Estate License #${compliance.agentLicenseNumber}, and the brokerage affiliation disclosed throughout this site.`,
    label: "About Arthur",
    href: "/about",
    image: {
      src: "/assets/live/arthur-pisko-jr-picture-jpg.jpg",
      alt: "Portrait of Arthur Pisko Jr. wearing glasses, a black shirt, and a plaid tie against a plain background.",
    },
  },
  {
    id: "connect-contact",
    title: "Real Estate Inquiry",
    description: "Send a New Jersey residential real-estate, partnership, or advertising inquiry through the protected contact form.",
    label: "Contact Arthur",
    href: "/contact",
    image: {
      src: "/assets/live/pitman-gloucester-jpg.jpg",
      alt: "Brick storefronts, cars, traffic lights, and motorcycles along a South Jersey commercial street.",
    },
  },
  {
    id: "connect-newsletter",
    title: "Newsletter",
    description: "Review the newsletter topics and subscribe through explicit consent and email double opt-in.",
    label: "View the Newsletter",
    href: "/newsletter",
    image: {
      src: "/assets/home-light-hero-beach-sunrise.jpg",
      alt: "Sunrise over a South Jersey beach with ocean waves, glowing sky, and shoreline in the foreground.",
    },
  },
  {
    id: "connect-why-new-jersey",
    title: "New Jersey Comparison Guide",
    description: "Use neutral questions and current official sources when comparing New Jersey with nearby states.",
    label: "Compare Regional Questions",
    href: "/why-new-jersey",
    image: {
      src: "/assets/live/philly-skyline-from-camden-city-camden-jpg.jpg",
      alt: "Philadelphia skyline viewed from South Jersey beyond trees and nearby homes.",
    },
  },
  {
    id: "connect-why-south-jersey",
    title: "South Jersey Comparison Guide",
    description: "Review a neutral framework for comparing particular New Jersey locations without ranking communities.",
    label: "Explore the Comparison Guide",
    href: "/why-south-jersey",
    image: {
      src: "/assets/live/camden-county-map-png.png",
      alt: "Camden County, New Jersey locator map.",
    },
  },
  {
    id: "connect-faq",
    title: "Frequently Asked Questions",
    description: "Find general answers about inquiries, written representation, compensation, the newsletter, providers, and advertising.",
    label: "Read the FAQ",
    href: "/faq",
  },
  {
    id: "connect-providers",
    title: "Local Provider Directory",
    description: "Review the provider-choice and material-relationship disclosures before opening the limited directory.",
    label: "View the Provider Directory",
    href: "/partners",
  },
  {
    id: "connect-advertise",
    title: "Advertising Information",
    description: "Review eligibility, labeling, relationship-disclosure, and inquiry requirements for local advertising.",
    label: "Review Advertising Information",
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
  images: item.image ? [{ ...item.image }] : [],
}));

export const pageOverrides: SitePage[] = [
  {
    path: "/",
    title: "South Jersey Real Estate Guide",
    sections: [
      {
        id: "home-hero",
        blocks: [
          { tag: "H1", text: "South Jersey Real Estate Guide" },
          {
            tag: "P",
            text: "Explore neutral, general information about municipalities across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
          },
          { tag: "A", text: "Explore Atlantic County", href: "/atlantic-county" },
        ],
        images: [
          {
            src: "/assets/live/philly-skyline-from-camden-city-camden-jpg.jpg",
            alt: "Philadelphia skyline viewed from South Jersey beyond trees and nearby homes.",
          },
        ],
      },
      {
        id: "home-about",
        blocks: [
          { tag: "H2", text: "About this guide" },
          {
            tag: "P",
            text: `${compliance.agentLicensedName} maintains this marketing website and is a ${compliance.agentLicenseType} affiliated with ${compliance.brokerLegalName}.`,
          },
          {
            tag: "P",
            text: "Community information is general and should be checked against current official sources before it is used in a real-estate decision.",
          },
          { tag: "A", text: "About Arthur", href: "/about" },
        ],
        images: [
          {
            src: "/assets/live/pitman-gloucester-jpg.jpg",
            alt: "Brick storefronts, cars, traffic lights, and motorcycles along a South Jersey commercial street.",
          },
        ],
      },
      actionSection("home-action"),
    ],
  },
  {
    path: "/counties",
    title: "South Jersey County Guides",
    sections: [
      {
        id: "counties-intro",
        kind: "intro",
        blocks: [
          { tag: "H1", text: "South Jersey County Guides" },
          {
            tag: "P",
            text: "Browse municipality directories for the seven New Jersey counties covered by this site. The guides provide general orientation and do not rank communities or replace current official information.",
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
            text: "Choose the destination that matches what you want to do next, from learning about the site operator to sending an inquiry or reviewing local-information resources.",
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
          { tag: "H1", text: "About the Site Operator" },
          {
            tag: "P",
            text: `${compliance.agentLicensedName} is a ${compliance.agentLicenseType}, NJ Real Estate License #${compliance.agentLicenseNumber}, affiliated with ${compliance.brokerLegalName}.`,
          },
          {
            tag: "P",
            text: "Arthur works with New Jersey buyers and sellers on residential real-estate transactions, with a focus on South Jersey.",
          },
          { tag: "H3", text: "Service area" },
          {
            tag: "P",
            text: "New Jersey, including Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
          },
          {
            tag: "P",
            text: "References to locations outside New Jersey are for general regional comparison and are not an offer of brokerage services outside New Jersey.",
          },
          { tag: "A", text: "Contact Arthur", href: "/contact" },
        ],
        images: [
          {
            src: "/assets/live/arthur-pisko-jr-picture-jpg.jpg",
            alt: "Portrait of Arthur Pisko Jr. wearing glasses, a black shirt, and a plaid tie against a plain background.",
          },
        ],
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
          { tag: "H1", text: "New Jersey Real Estate Inquiry" },
          {
            tag: "P",
            text: "Use the form to ask about buying or selling residential real estate in New Jersey, or to send a partnership or advertising inquiry.",
          },
          {
            tag: "P",
            text: `Licensed brokerage: ${compliance.brokerLegalName}. Licensed brokerage office: ${compliance.licensedOfficePhone}.`,
          },
        ],
        images: [],
      },
      {
        id: "contact-resources",
        blocks: [
          { tag: "H3", text: "Local Provider Directory" },
          {
            tag: "P",
            text: "Review the provider-choice and relationship disclosures before selecting any independent provider.",
          },
          { tag: "A", text: "View the Provider Directory", href: "/partners" },
          { tag: "H3", text: "Local Advertising" },
          {
            tag: "P",
            text: "Advertising placements are for eligible local businesses and are labeled when paid.",
          },
          { tag: "A", text: "View Advertising Information", href: "/advertise" },
        ],
        images: [],
      },
    ],
  },
  {
    path: "/partners",
    title: "South Jersey Local Provider Directory",
    sections: [actionSection("partners-action")],
  },
  {
    path: "/advertise",
    title: "Advertising Information",
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
          { tag: "P", text: "Last updated: July 18, 2026" },
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
            text: "You are free to choose any provider. Directory inclusion, advertising, or a third-party link is not a guarantee or warranty of services. Paid placements are labeled Sponsored and Paid advertisement, and material relationships should be disclosed with the relevant entry.",
          },
          { tag: "H2", text: "Fair housing" },
          {
            tag: "P",
            text: `${compliance.brokerLegalName} and its affiliated licensees provide housing-related services without discrimination based on any characteristic protected by federal, New Jersey, or applicable local law.`,
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
          { tag: "P", text: "Last updated: July 18, 2026" },
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
