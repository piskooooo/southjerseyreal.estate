import { compliance } from "./compliance";
import type { ContentBlock } from "./types";

export type ResourcePanel = {
  id: string;
  title: string;
  summary: string;
  blocks: ContentBlock[];
};

export type ResourcePage = {
  title: string;
  intro: string;
  supportText: string;
  panels: ResourcePanel[];
  closingTitle?: string;
  closingText?: string;
  closingLink?: {
    label: string;
    href: string;
  };
};

export const resourcePages: Record<string, ResourcePage> = {
  "/faq": {
    title: "Frequently Asked Questions",
    intro:
      "Quick answers about working with Arthur, buying or selling, the newsletter, local providers, and advertising.",
    supportText:
      "These are starting points. Specific terms belong in written agreements, and specialized questions should go to the appropriate professional.",
    panels: [
      {
        id: "buy",
        title: "Buying a Home",
        summary: "Initial conversations, representation, and compensation.",
        blocks: [
          { tag: "H3", text: "How do I begin?" },
          {
            tag: "P",
            text: "Tell Arthur where you are looking, your timing, the type of property you have in mind, and any questions already on your list. An initial conversation is a simple place to begin.",
          },
          { tag: "H3", text: "How are representation and compensation handled?" },
          {
            tag: "P",
            text: "Broker compensation is not set by law and is fully negotiable. Representation, services, and compensation must be addressed in the applicable written agreement before brokerage services begin.",
          },
          { tag: "H3", text: "Can Arthur advise me about a location?" },
          {
            tag: "P",
            text: "Arthur can help find objective property and transaction information and point you toward current sources for schools, taxes, flood information, transportation, and other community details.",
          },
        ],
      },
      {
        id: "sell",
        title: "Selling a Home",
        summary: "Property-specific planning and written representation.",
        blocks: [
          { tag: "H3", text: "Can I request a value discussion?" },
          {
            tag: "P",
            text: "Yes. Arthur can start with your goals and the property details, then review current market information with you. A real estate value discussion is not an appraisal and does not promise a particular sale price.",
          },
          { tag: "H3", text: "Does submitting the form create a listing agreement?" },
          {
            tag: "P",
            text: "No. A form submission is an inquiry only. Any representation and compensation terms require an appropriate written agreement.",
          },
        ],
      },
      {
        id: "communications",
        title: "Contact and Newsletter",
        summary: "How inquiry and newsletter permissions remain separate.",
        blocks: [
          { tag: "H3", text: "Does a contact inquiry subscribe me to email marketing?" },
          {
            tag: "P",
            text: "No. The contact form only authorizes a response to your inquiry. Newsletter signup is separate and includes an email confirmation.",
          },
          { tag: "H3", text: "Can I unsubscribe?" },
          {
            tag: "P",
            text: "Yes. Every newsletter includes an unsubscribe link, and privacy requests can be sent using the contact information in the Privacy Policy.",
          },
        ],
      },
      {
        id: "directory-advertising",
        title: "Provider Directory and Advertising",
        summary: "Choice, relationship disclosure, and paid-placement labels.",
        blocks: [
          { tag: "H3", text: "Does directory inclusion mean a provider is endorsed?" },
          {
            tag: "P",
            text: "No. You are free to choose any provider. Inclusion is not a guarantee or warranty, and material relationships are disclosed with the relevant entry.",
          },
          { tag: "H3", text: "How are paid placements identified?" },
          {
            tag: "P",
            text: "Any paid placement must display both Sponsored and Paid advertisement labels. The site does not currently display a paid provider entry.",
          },
        ],
      },
    ],
    closingTitle: "Have a property-specific question?",
    closingText: "Use the contact form for an inquiry about New Jersey residential real estate.",
    closingLink: { label: "Contact Arthur", href: "/contact" },
  },
  "/partners": {
    title: "South Jersey Local Provider Directory",
    intro:
      "A small directory of organizations and tools connected with Arthur or this website.",
    supportText:
      "You are free to choose any provider. Directory inclusion is not a guarantee or warranty, and relevant relationships are noted with each entry.",
    panels: [
      {
        id: "brokerage-affiliation",
        title: compliance.brokerLegalName,
        summary: "Licensed brokerage affiliation.",
        blocks: [
          { tag: "H3", text: compliance.brokerDescriptor },
          {
            tag: "P",
            text: `${compliance.agentLicensedName}, REALTOR®, is a ${compliance.agentLicenseType} affiliated with ${compliance.brokerLegalName}.`,
          },
          { tag: "P", text: `Licensed brokerage office: ${compliance.licensedOfficePhone}.` },
          { tag: "A", text: "Visit the Brokerage Website", href: compliance.brokerWebsite },
        ],
      },
      {
        id: "homebase-crm",
        title: "HomeBase CRM",
        summary: "Real-estate contact-management software.",
        blocks: [
          {
            tag: "P",
            text: "HomeBase CRM is a separate software project created by Arthur Pisko Jr., which is why it appears in this directory.",
          },
          { tag: "P", text: "HomeBase CRM is not a real-estate brokerage or settlement-service provider." },
          { tag: "A", text: "Visit HomeBase CRM", href: "https://homebasecrm.com" },
        ],
      },
    ],
    closingTitle: "Choosing a provider",
    closingText:
      "Compare your options, confirm current credentials when applicable, and choose the provider that fits your needs.",
    closingLink: { label: "Ask a Question", href: "/contact" },
  },
  "/advertise": {
    title: "Local Advertising Information",
    intro:
      "South Jersey businesses may inquire about clearly labeled advertising placements on the site.",
    supportText:
      "No paid placements are currently displayed. Format, timing, price, and eligibility are confirmed before anything is published.",
    panels: [
      {
        id: "advertising-labels",
        title: "Required labels and disclosures",
        summary: "Visitors should always know when content is paid.",
        blocks: [
          {
            tag: "P",
            text: "Every paid placement must display both Sponsored and Paid advertisement labels near the business name or content.",
          },
          {
            tag: "P",
            text: "Any material relationship with Arthur Pisko Jr., this website, or the affiliated brokerage must be disclosed with the placement.",
          },
          {
            tag: "P",
            text: "A paid placement does not become a brokerage recommendation, guarantee, warranty, or statement about licensing, insurance, fees, availability, or performance.",
          },
        ],
      },
      {
        id: "advertising-eligibility",
        title: "Eligibility",
        summary: "Businesses and proposed content are reviewed before publication.",
        blocks: [
          {
            tag: "P",
            text: "The proposed business, destination link, claims, images, target locations, and disclosures must be reviewed before publication.",
          },
          {
            tag: "P",
            text: "Businesses directly involved in a real-estate settlement service are not currently accepted for paid placement on this site.",
          },
          {
            tag: "P",
            text: "The site may decline or remove a placement and does not promise traffic, inquiries, transactions, or other results.",
          },
        ],
      },
      {
        id: "advertising-process",
        title: "Inquiry process",
        summary: "Share the basics needed to review an idea.",
        blocks: [
          {
            tag: "P",
            text: "Use the contact form and choose Partnership or advertising inquiry. Include the legal business name, public website, proposed content, desired locations, and any relationship to Arthur or the brokerage.",
          },
          {
            tag: "P",
            text: "Do not send passwords, payment-card information, client records, or other sensitive information through the public form.",
          },
        ],
      },
    ],
    closingTitle: "Submit an advertising inquiry",
    closingText: "An inquiry does not reserve a placement or create an agreement.",
    closingLink: { label: "Contact About Advertising", href: "/contact" },
  },
};
