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
      "Quick answers about real estate inquiries, the newsletter, local providers, and advertising.",
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
            text: "Use the contact form to share where you are looking, your timing, the type of property you have in mind, and any questions already on your list.",
          },
          { tag: "H3", text: "How are representation and compensation handled?" },
          {
            tag: "P",
            text: "Broker compensation is not set by law and is fully negotiable. Representation, services, and compensation must be addressed in the applicable written agreement before brokerage services begin.",
          },
          { tag: "H3", text: "Can I get help researching a location?" },
          {
            tag: "P",
            text: "A real estate professional can help locate objective property and transaction information and point you toward current sources for schools, taxes, flood information, transportation, and other community details.",
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
            text: "Yes. A property value discussion can start with your goals, the property details, and current market information. It is not an appraisal and does not promise a particular sale price.",
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
        summary: "Why real-estate providers and paid local advertising are kept separate.",
        blocks: [
          { tag: "H3", text: "What is the Real Estate Provider Directory?" },
          {
            tag: "P",
            text: "It is an unpaid list of lenders, title companies, and other transaction-related professionals. The site operator and affiliated brokerage receive no compensation for including a provider or for a consumer's selection. You are free to choose any provider.",
          },
          { tag: "A", text: "Browse Real Estate Providers", href: "/partners" },
          { tag: "H3", text: "Is local advertising the same thing?" },
          {
            tag: "P",
            text: "No. Paid advertising is reserved for local businesses whose services are not part of a real estate transaction. Each live placement is clearly identified as a Paid advertisement where it appears.",
          },
          { tag: "A", text: "View Local Advertising", href: "/advertise" },
        ],
      },
    ],
    closingTitle: "Have a property-specific question?",
    closingText: "Use the contact form for an inquiry about New Jersey residential real estate.",
    closingLink: { label: "Contact", href: "/contact" },
  },
  "/partners": {
    title: "Real Estate Provider Directory",
    intro:
      "Mortgage professionals, title companies, and other transaction-related providers serving New Jersey, with an emphasis on South Jersey.",
    supportText:
      "Provider details were checked against official public profiles on July 19, 2026. The Partners and Vendors section separately identifies the site's disclosed business relationships. Paid advertising for unrelated local businesses is handled separately.",
    panels: [
      {
        id: "partners-and-vendors",
        title: "Partners and Vendors",
        summary: "A software vendor and the site owner's affiliated brokerage, with each relationship stated clearly.",
        blocks: [
          { tag: "H3", text: "HomeBase CRM" },
          {
            tag: "P",
            text: "Software vendor. HomeBase CRM is owned by Fat Cat Finance, LLC. There is no payment or cross-ownership relationship between HomeBase CRM and South Jersey Real Estate.",
          },
          { tag: "A", text: "Visit HomeBase CRM", href: "https://homebasecrm.com" },
          { tag: "H3", text: "The Plum Real Estate Group, LLC" },
          {
            tag: "P",
            text: "Affiliated brokerage. The Plum Real Estate Group, LLC is the New Jersey real estate brokerage with which Arthur Pisko Jr. is affiliated. This is a disclosed brokerage affiliation, not a paid directory placement.",
          },
          { tag: "A", text: "Visit The Plum Real Estate Group", href: "https://www.theplumrealestategroup.com/" },
        ],
      },
      {
        id: "mortgage-professionals",
        title: "Mortgage Professionals",
        summary: "Five lending contacts with current company profiles and NMLS identifiers.",
        blocks: [
          { tag: "H3", text: "Sam Hamilton" },
          {
            tag: "P",
            text: "Loan Officer, Movement Mortgage | NMLS #1094595",
          },
          { tag: "P", text: "Phone: (856) 366-8585 | Email: sam.hamilton@movement.com" },
          { tag: "A", text: "View Sam Hamilton's Official Profile", href: "https://movement.com/lo/sam-hamilton" },
          { tag: "H3", text: "Jill Granato" },
          {
            tag: "P",
            text: "Mortgage Loan Originator, AnnieMac | NMLS #363390",
          },
          { tag: "P", text: "Office: (856) 252-1194 | Mobile: (609) 221-6608 | Email: jgranato@annie-mac.com" },
          { tag: "A", text: "View Jill Granato's Official Profile", href: "https://annie-mac.com/lo/jillgranato/" },
          { tag: "H3", text: "Matt Ziegert" },
          {
            tag: "P",
            text: "Divisional Sales Manager, CrossCountry Mortgage | NMLS #1471164",
          },
          { tag: "P", text: "Office: (973) 823-1300 | Mobile: (201) 563-7404" },
          { tag: "A", text: "View Matt Ziegert's Official Profile", href: "https://crosscountrymortgage.com/denville-nj-3480/matthew-ziegert/" },
          { tag: "H3", text: "Terri Santiago-Parker" },
          {
            tag: "P",
            text: "Divisional Vice President, CrossCountry Mortgage | NMLS #135602",
          },
          { tag: "P", text: "Woodbury, NJ | Phone: (856) 776-6886" },
          { tag: "A", text: "View Terri Santiago-Parker's Official Profile", href: "https://crosscountrymortgage.com/woodbury-nj-2506/theresa-parker/" },
          { tag: "H3", text: "Drew Whipple" },
          {
            tag: "P",
            text: "Mortgage Loan Officer, Citizens | NMLS #1132486",
          },
          { tag: "P", text: "Marlton, NJ | Phone: (856) 924-1682 | Email: drew.whipple@citizensbank.com" },
          { tag: "A", text: "View Drew Whipple's Official Profile", href: "https://lo.citizensbank.com/nj/marlton/drew-whipple" },
        ],
      },
      {
        id: "title-companies",
        title: "Title and Settlement Companies",
        summary: "Six companies with active official websites and New Jersey services.",
        blocks: [
          { tag: "H3", text: "Cape Atlantic Title Agency, LLC" },
          { tag: "P", text: "Linwood, NJ | Title searches, title insurance, and settlement services." },
          { tag: "A", text: "Visit Cape Atlantic Title Agency", href: "https://capeatlantictitle.com/" },
          { tag: "H3", text: "Two Rivers Title Company, LLC" },
          { tag: "P", text: "Title insurance, escrow, and settlement services in New Jersey and additional states." },
          { tag: "A", text: "Visit Two Rivers Title Company", href: "https://tworiverstitle.com/" },
          { tag: "H3", text: "SJS Title, LLC" },
          { tag: "P", text: "New Jersey title and real estate settlement services, with offices including Cherry Hill, Medford, and Haddonfield." },
          { tag: "A", text: "Visit SJS Title", href: "https://www.sjstitleco.com/" },
          { tag: "H3", text: "The Title Company of Jersey" },
          { tag: "P", text: "Title insurance and settlement services with offices serving Southern New Jersey." },
          { tag: "A", text: "Visit The Title Company of Jersey", href: "https://www.tcjonline.com/" },
          { tag: "H3", text: "Surety Title Company, LLC" },
          { tag: "P", text: "Title services through its Woodbury office and other New Jersey locations." },
          { tag: "A", text: "Visit Surety Title Company", href: "https://www.mysurety.com/" },
          { tag: "H3", text: "Foundation Title, LLC" },
          { tag: "P", text: "Marlton-based title insurance and settlement services available throughout New Jersey." },
          { tag: "A", text: "Visit Foundation Title", href: "https://foundationtitle.com/" },
        ],
      },
      {
        id: "additional-provider-types",
        title: "Additional Provider Types",
        summary: "Other transaction-related categories that can be added as current information is confirmed.",
        blocks: [
          { tag: "P", text: "Home inspectors" },
          { tag: "P", text: "Real estate attorneys" },
          { tag: "P", text: "Surveyors and insurance professionals" },
          { tag: "P", text: "Contractors and repair services" },
          { tag: "P", text: "Photographers and other transaction-support professionals" },
        ],
      },
      {
        id: "directory-participation",
        title: "Directory Participation",
        summary: "What to provide when suggesting a professional or business.",
        blocks: [
          { tag: "P", text: "Directory listings are not sold, and there is no paid ranking or premium placement." },
          {
            tag: "P",
            text: "Send the provider's public business name, official website, contact information, service area, and license, registration, or NMLS identifier when applicable.",
          },
          {
            tag: "P",
            text: "Also disclose any referral, affiliate, family, ownership, or other material relationship involving the website operator or affiliated brokerage.",
          },
          { tag: "A", text: "Submit Provider Information", href: "/contact" },
        ],
      },
    ],
    closingTitle: "Know a provider to consider?",
    closingText:
      "Send their current public information for review before an entry is added.",
    closingLink: { label: "Submit a Provider", href: "/contact" },
  },
  "/advertise": {
    title: "Advertise a Local Business",
    intro:
      "Paid placements are available to South Jersey businesses whose services are not part of a real estate transaction.",
    supportText:
      "Advertising is separate from the unpaid Real Estate Provider Directory. Each live placement is identified as a Paid advertisement where it appears.",
    panels: [
      {
        id: "advertising-purpose",
        title: "Local Visibility",
        summary: "Place a business alongside South Jersey county, town, and local-information content.",
        blocks: [
          {
            tag: "P",
            text: "Advertising can introduce a local business to people reading about South Jersey communities and real estate.",
          },
          {
            tag: "P",
            text: "Placements can link directly to the business's website or public social profile.",
          },
          {
            tag: "P",
            text: "A placement does not promise traffic, inquiries, transactions, or other results.",
          },
        ],
      },
      {
        id: "advertising-eligibility",
        title: "Eligibility",
        summary: "Paid advertising is for local businesses outside the real estate transaction.",
        blocks: [
          { tag: "H3", text: "Examples" },
          { tag: "P", text: "Restaurants, cafes, shops, and boutiques" },
          { tag: "P", text: "Arts, entertainment, recreation, and community organizations" },
          { tag: "P", text: "Fitness, wellness, salons, and other general local services" },
          { tag: "H3", text: "Handled by the unpaid directory instead" },
          { tag: "P", text: "Lenders, mortgage brokers, title and settlement companies, inspectors, appraisers, real estate brokerages, and other transaction-related providers." },
        ],
      },
      {
        id: "advertising-options",
        title: "Placement Options",
        summary: "Choose broad site visibility or placement near a relevant community.",
        blocks: [
          { tag: "H3", text: "Advertising page placement" },
          { tag: "P", text: "A listing on the site's advertising page." },
          { tag: "H3", text: "County or town placement" },
          { tag: "P", text: "A placement within selected county or town content when the business and location are relevant." },
          { tag: "H3", text: "What a placement can include" },
          { tag: "P", text: "Business name, logo or photo, short description, location or service area, and a link to the business's website or public social profile." },
        ],
      },
      {
        id: "advertising-process",
        title: "How It Works",
        summary: "From the initial inquiry to a reviewed placement.",
        blocks: [
          {
            tag: "P",
            text: "Use the contact form and choose Advertising inquiry. Include the public business name, website, proposed content, and preferred locations.",
          },
          {
            tag: "P",
            text: "The business, destination link, claims, images, placement, timing, and price are reviewed before a written agreement is made.",
          },
          { tag: "P", text: "After approval, provide the final logo or image, description, link, and any required disclosures." },
        ],
      },
      {
        id: "advertising-standards",
        title: "Clear Advertising Standards",
        summary: "Simple rules that keep paid content recognizable and accurate.",
        blocks: [
          { tag: "P", text: "Every live placement is labeled Paid advertisement next to the business name or content." },
          { tag: "P", text: "Any material relationship beyond the advertising payment is disclosed with the placement." },
          { tag: "P", text: "Business claims and images must be current, accurate, and supportable." },
          { tag: "P", text: "A paid placement is not a brokerage recommendation, guarantee, or warranty, and the site may decline or remove a placement." },
        ],
      },
    ],
    closingTitle: "Interested in advertising?",
    closingText: "Send the business details and the locations you have in mind to discuss current options.",
    closingLink: { label: "Contact About Advertising", href: "/contact" },
  },
};
