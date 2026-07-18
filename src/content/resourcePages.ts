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
      "General information about contacting Arthur, New Jersey real-estate services, the newsletter, the provider directory, and local advertising.",
    supportText:
      "These answers are informational and do not replace a written brokerage agreement or advice from an attorney, lender, inspector, insurer, tax professional, or other qualified professional.",
    panels: [
      {
        id: "buy",
        title: "Buying a Home",
        summary: "Initial conversations, representation, and compensation.",
        blocks: [
          { tag: "H3", text: "How do I begin?" },
          {
            tag: "P",
            text: "Use the contact form to describe the New Jersey location, timing, property type, and questions you want to discuss. Contacting Arthur does not create an agency relationship.",
          },
          { tag: "H3", text: "How are representation and compensation handled?" },
          {
            tag: "P",
            text: "Broker compensation is not set by law and is fully negotiable. Representation, services, and compensation must be addressed in the applicable written agreement before brokerage services begin.",
          },
          { tag: "H3", text: "Can Arthur advise me about a location?" },
          {
            tag: "P",
            text: "Arthur can help identify objective property and transaction information. Consumers should independently research schools, public safety, taxes, flood information, transportation, and other community criteria using current official sources.",
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
            text: "Yes. A preliminary discussion is general and is not an appraisal, guarantee of value, or promise of a sale price. Property condition, current data, and the proposed scope of services require separate review.",
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
            text: "No. The contact form authorizes a response to that inquiry. Newsletter signup uses a separate required consent and Brevo double opt-in confirmation.",
          },
          { tag: "H3", text: "Can I unsubscribe?" },
          {
            tag: "P",
            text: "Yes. Newsletter messages include an unsubscribe mechanism. Privacy requests may also be sent through the contact information in the Privacy Policy.",
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
      "A limited directory of organizations and tools with a disclosed connection to this website or its operator.",
    supportText:
      "Directory entries are informational. You are free to choose any provider, and inclusion is not a recommendation, guarantee, or warranty.",
    panels: [
      {
        id: "brokerage-affiliation",
        title: compliance.brokerLegalName,
        summary: "Licensed brokerage affiliation.",
        blocks: [
          { tag: "H3", text: compliance.brokerDescriptor },
          {
            tag: "P",
            text: `${compliance.agentLicensedName} is a ${compliance.agentLicenseType} affiliated with ${compliance.brokerLegalName}. NJDOBI reference numbers: brokerage ${compliance.brokerLicenseReferenceNumber}; salesperson ${compliance.agentLicenseNumber}.`,
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
            text: "Material relationship disclosure: HomeBase CRM is a separate Arthur Pisko Jr. software project. Its inclusion here is not an independent endorsement.",
          },
          { tag: "P", text: "HomeBase CRM is not a real-estate brokerage or settlement-service provider." },
          { tag: "A", text: "Visit HomeBase CRM", href: "https://homebasecrm.com" },
        ],
      },
      {
        id: "provider-status",
        title: "Other providers",
        summary: "No additional provider entries are currently published.",
        blocks: [
          {
            tag: "P",
            text: "Additional entries are withheld until the provider's identity, current credentials when applicable, website, material relationships, referral arrangements, and paid-placement status are documented.",
          },
        ],
      },
    ],
    closingTitle: "Provider choice",
    closingText:
      "Evaluate providers independently, confirm current credentials where applicable, compare options, and review the provider's own terms and privacy practices.",
    closingLink: { label: "Ask a Directory Question", href: "/contact" },
  },
  "/advertise": {
    title: "Local Advertising Information",
    intro:
      "The site may consider clearly labeled paid placements from eligible local businesses after identity, content, and relationship review.",
    supportText:
      "No paid placement is currently displayed. Availability, format, duration, price, and eligibility require written confirmation before publication.",
    panels: [
      {
        id: "advertising-labels",
        title: "Required labels and disclosures",
        summary: "Paid content must be unmistakable to visitors.",
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
        summary: "Publication is subject to review and written approval.",
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
        summary: "Submit enough information for a compliance and content review.",
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
