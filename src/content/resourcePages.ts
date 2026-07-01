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
      "Quick answers for South Jersey buyers, sellers, real estate partners, and local businesses looking to connect with homeowners in the area.",
    supportText: "Open the section that matches what you need. Nothing is expanded by default, so the page stays easy to scan.",
    panels: [
      {
        id: "buy",
        title: "Buying a Home",
        summary: "Getting started, buyer representation, and what to expect before showings and offers.",
        blocks: [
          { tag: "H3", text: "How do I start the home buying process?" },
          {
            tag: "P",
            text: "The first step is to get pre-approved with a lender so you know your budget. From there, we can set up customized home searches and schedule showings that fit your needs.",
          },
          { tag: "A", text: "Start your home search", href: "/contact" },
          { tag: "H3", text: "Do I need to work with a buyer's agent?" },
          {
            tag: "P",
            text: "No, but having a dedicated buyer's agent gives you representation throughout the process. As your agent, I can help negotiate on your behalf, coordinate inspections, and guide you from offer to closing.",
          },
          { tag: "A", text: "Learn more about working together", href: "/about" },
          { tag: "H3", text: "How much does it cost to use a buyer's agent?" },
          {
            tag: "P",
            text: "Buyer-agent compensation can vary by listing and agreement. In many situations, compensation may be offered by the seller side, but I will walk you through the options clearly before you commit to anything.",
          },
          { tag: "A", text: "Request a free consultation", href: "/contact" },
        ],
      },
      {
        id: "sell",
        title: "Selling a Home",
        summary: "Pricing, marketing, seller costs, and how the listing process is handled.",
        blocks: [
          { tag: "H3", text: "What's the first step in selling my home?" },
          {
            tag: "P",
            text: "Schedule a free home evaluation so we can review your property, current market trends, and the best listing strategy for your goals.",
          },
          { tag: "A", text: "Get your free home evaluation", href: "/contact" },
          { tag: "H3", text: "How do you market homes?" },
          {
            tag: "P",
            text: "I use a comprehensive marketing plan that includes professional photography, MLS exposure, targeted online advertising, and placement across major real estate platforms.",
          },
          { tag: "A", text: "See how I market your home", href: "/about" },
          { tag: "H3", text: "What costs should I expect when selling?" },
          {
            tag: "P",
            text: "Typical costs can include real estate commission, transfer taxes, and any agreed-upon repairs or credits to the buyer. I will provide a clear net sheet so you know your bottom line up front.",
          },
          { tag: "A", text: "Request a seller consultation", href: "/contact" },
        ],
      },
      {
        id: "partner",
        title: "Partnerships",
        summary: "Who can be listed as a real estate resource and how partner recommendations work.",
        blocks: [
          { tag: "H3", text: "What kinds of partners do you work with?" },
          {
            tag: "P",
            text: "We collaborate with professionals directly involved in the real estate process, including title companies, lenders, inspectors, contractors, and photographers.",
          },
          { tag: "A", text: "Learn more about partnerships", href: "/partners" },
          { tag: "H3", text: "Do partners pay to be listed?" },
          {
            tag: "P",
            text: "No. There is no payment or advertising fee. These are trusted recommendations provided as a resource to clients.",
          },
          { tag: "A", text: "See our partners page", href: "/partners" },
          { tag: "H3", text: "How can I be considered as a partner?" },
          {
            tag: "P",
            text: "If you are a real estate service provider interested in being included, review the partner guidelines and send an introduction with your credentials, experience, and service area.",
          },
          { tag: "A", text: "Partner with us", href: "/partners" },
        ],
      },
      {
        id: "advertiser",
        title: "Advertising",
        summary: "Local business eligibility, placement options, ad content, and how to get started.",
        blocks: [
          { tag: "H3", text: "Who can advertise on your site?" },
          {
            tag: "P",
            text: "Local businesses that serve South Jersey residents, such as restaurants, shops, gyms, salons, and service providers. Real estate settlement service businesses are not eligible for advertising.",
          },
          { tag: "A", text: "Learn more about advertising", href: "/advertise" },
          { tag: "H3", text: "Where will my ad appear?" },
          {
            tag: "P",
            text: "Ads may appear on the main Advertise With Us page, or as sponsored local business highlights within county and town pages.",
          },
          { tag: "A", text: "See ad placement options", href: "/advertise" },
          { tag: "H3", text: "What does an ad include?" },
          {
            tag: "P",
            text: "Each listing can include your business name, logo or photo, a short description, and a link to your website or social media.",
          },
          { tag: "A", text: "View advertising details", href: "/advertise" },
          { tag: "H3", text: "How do I get started?" },
          {
            tag: "P",
            text: "To view current packages and submit your business for consideration, head to the Advertising page and reach out with your business details.",
          },
          { tag: "A", text: "Get started with advertising", href: "/advertise" },
        ],
      },
    ],
    closingTitle: "Still have a question?",
    closingText: "Send a message with what you are trying to do, and I will point you in the right direction.",
    closingLink: { label: "Contact Arthur", href: "/contact" },
  },
  "/partners": {
    title: "Partnerships & Local Resources",
    intro:
      "Trusted real estate-related professionals for South Jersey buyers and sellers, organized so clients can quickly understand who may be helpful during a transaction.",
    supportText:
      "This page is for real estate transaction resources. Local businesses outside the transaction process should use the Advertising page instead.",
    panels: [
      {
        id: "partner-types",
        title: "Who We Partner With",
        summary: "The real estate service categories that may be included as trusted resources.",
        blocks: [
          { tag: "P", text: "Title companies" },
          { tag: "P", text: "Mortgage professionals" },
          { tag: "P", text: "Home inspectors" },
          { tag: "P", text: "Contractors & repair services" },
          { tag: "P", text: "Photographers & other transaction-related providers" },
        ],
      },
      {
        id: "mortgage-partners",
        title: "Mortgage Professionals",
        summary: "Current lending contacts listed as local mortgage resources.",
        blocks: [
          { tag: "H3", text: "Sam Hamilton" },
          { tag: "P", text: "Movement Mortgage - movement.com" },
          { tag: "P", text: "Email: sam.hamilton@movement.com" },
          { tag: "P", text: "Office: (856) 366-8585" },
          { tag: "H3", text: "Jill Granato" },
          { tag: "P", text: "AnnieMac - jillgranato.annie-mac.com" },
          { tag: "P", text: "Email: jgranato@annie-mac.com" },
          { tag: "P", text: "Office: (856) 252-1194 - Mobile: (609) 221-6608" },
          { tag: "H3", text: "Matt Ziegert" },
          { tag: "P", text: "Team Ziegert / CrossCountry Mortgage - ccm.com" },
          { tag: "P", text: "Email: matt.ziegert@ccm.com" },
          { tag: "P", text: "Office: 973-823-1300 - Mobile: (201) 563-7404" },
          { tag: "H3", text: "Terri Parker" },
          { tag: "P", text: "The Parker Team / CrossCountry Mortgage - crosscountrymortgage.com" },
          { tag: "P", text: "Email: Terri.Parker@ccm.com" },
          { tag: "P", text: "Office: (856) 776-6886" },
          { tag: "H3", text: "Drew Whipple" },
          { tag: "P", text: "OceanFirst Bank - oceanfirst.mymortgage-online.com" },
          { tag: "P", text: "Email: awhipple@oceanfirst.com" },
          { tag: "P", text: "Office: (856) 924-1682" },
        ],
      },
      {
        id: "title-partners",
        title: "Title Companies",
        summary: "County-by-county title resources for South Jersey closings.",
        blocks: [
          { tag: "H3", text: "Atlantic County" },
          { tag: "P", text: "Cape Atlantic Title Agency, LLC - Linwood, NJ - capeatlantictitle.com" },
          { tag: "P", text: "Local experts offering full title and settlement services with a focus on personalized client care." },
          { tag: "H3", text: "Burlington County" },
          { tag: "P", text: "Two Rivers Title Company, LLC - Willingboro, NJ - tworiverstitle.com" },
          { tag: "P", text: "Trusted by buyers, sellers, and agents across New Jersey for reliable title and escrow services." },
          { tag: "H3", text: "Camden County" },
          { tag: "P", text: "SJS Title, LLC - Cherry Hill, NJ - sjstitle.com" },
          { tag: "P", text: "Our go-to partner for smooth, efficient closings in Camden County and beyond." },
          { tag: "H3", text: "Cape May County" },
          { tag: "P", text: "The Title Company of Jersey - Cape May Court House, NJ - tcjonline.com" },
          { tag: "P", text: "Serving Cape May and nearby counties with decades of experience in real estate transactions." },
          { tag: "H3", text: "Cumberland County" },
          { tag: "P", text: "Signature Title Agency - Millville, NJ - signaturetitleagency.com" },
          { tag: "P", text: "Known for professionalism and timely processing in Cumberland and surrounding counties." },
          { tag: "H3", text: "Gloucester County" },
          { tag: "P", text: "Surety Title Company, LLC - Woodbury, NJ - suretytitle.com" },
          { tag: "P", text: "A full-service agency that has built a strong reputation among agents and lenders alike." },
          { tag: "H3", text: "Salem County" },
          { tag: "P", text: "Foundation Title, LLC - Woodstown, NJ - foundationtitle.com" },
          { tag: "P", text: "Reliable and responsive service covering rural and residential closings in Salem County." },
        ],
      },
      {
        id: "partners-faq",
        title: "FAQ & Disclaimer",
        summary: "How partner listings work, who can be considered, and what clients should know.",
        blocks: [
          { tag: "H3", text: "Do partners pay to be listed?" },
          {
            tag: "P",
            text: "No. There is no cost or compensation for being listed. These are trusted recommendations I share solely for the convenience of my clients.",
          },
          { tag: "H3", text: "Who can be considered as a partner?" },
          {
            tag: "P",
            text: "Only real estate transaction-related professionals such as title companies, mortgage lenders, inspectors, contractors, and photographers.",
          },
          { tag: "H3", text: "How do I apply to be included?" },
          {
            tag: "P",
            text: "Review the partner types above and send an introduction with your credentials, experience, and service area. partners@southjerseyreal.estate",
          },
          { tag: "H3", text: "Important disclaimer" },
          {
            tag: "P",
            text: "These are professionals and businesses I trust and recommend as a convenience to my clients. I do not receive any compensation or other benefits for listing anyone here. Clients are always free to use any service provider of their choice.",
          },
        ],
      },
    ],
    closingTitle: "Looking to partner with us?",
    closingText:
      "If you are directly involved in the real estate process and serve South Jersey clients, send an introduction with your credentials and service area.",
    closingLink: { label: "Contact Arthur", href: "/contact" },
  },
  "/advertise": {
    title: "Advertise With Us",
    intro: "Promote your business to South Jersey homeowners, buyers, and sellers through targeted local exposure.",
    supportText:
      "Advertising is for non-real-estate businesses. Title companies, lenders, inspectors, appraisers, REALTOR® professionals, and other transaction providers should use the Partnerships page.",
    panels: [
      {
        id: "advertise-why",
        title: "Why Advertise Here?",
        summary: "Reach people already researching South Jersey communities, homes, and local resources.",
        blocks: [
          { tag: "P", text: "Your business is seen by active local buyers and sellers browsing homes in South Jersey." },
          { tag: "P", text: "Visibility on highly targeted county and town pages, not just a generic directory." },
          { tag: "P", text: "Showcase your business alongside the communities you serve." },
        ],
      },
      {
        id: "advertise-eligibility",
        title: "Eligibility",
        summary: "Who can advertise here, and who belongs on the Partnerships page instead.",
        blocks: [
          { tag: "H3", text: "Eligible Businesses" },
          { tag: "P", text: "Restaurants & cafes" },
          { tag: "P", text: "Retail shops & boutiques" },
          { tag: "P", text: "Home services, including landscaping, cleaning, and contractors" },
          { tag: "P", text: "Gyms, salons, health & wellness" },
          { tag: "P", text: "Community organizations" },
          { tag: "H3", text: "Not Eligible" },
          { tag: "P", text: "Title companies" },
          { tag: "P", text: "Lenders & mortgage brokers" },
          { tag: "P", text: "Inspectors & appraisers" },
          { tag: "P", text: "REALTOR® professionals or brokerage services" },
          { tag: "P", text: "Any real estate transaction service" },
        ],
      },
      {
        id: "advertise-options",
        title: "Advertising Options",
        summary: "Standard placements and premium placements for more local visibility.",
        blocks: [
          { tag: "H3", text: "Standard Placement" },
          { tag: "P", text: "Listing on the Advertise With Us page." },
          {
            tag: "P",
            text: "Includes your business name, logo or image, a short description, and a link to your website or social media.",
          },
          { tag: "H3", text: "Premium Placement" },
          { tag: "P", text: "Everything in Standard, plus:" },
          { tag: "P", text: "Featured as a Sponsored Local Business inside the town/county pages most relevant to your audience." },
          { tag: "P", text: "Larger visual presence and priority positioning." },
        ],
      },
      {
        id: "advertise-process",
        title: "How It Works",
        summary: "The basic steps from inquiry to live placement.",
        blocks: [
          { tag: "P", text: "Contact us at advertise@southjerseyreal.estate." },
          { tag: "P", text: "We will share available packages, pricing, and placement options." },
          { tag: "P", text: "Submit your business info, including logo, description, link, and target towns/counties." },
          { tag: "P", text: "We review and confirm placement." },
          { tag: "P", text: "Your ad goes live after the placement is approved and prepared." },
        ],
      },
      {
        id: "advertise-faq",
        title: "Advertising FAQ",
        summary: "Placement, included assets, and pricing questions.",
        blocks: [
          { tag: "H3", text: "Where will my ad appear?" },
          {
            tag: "P",
            text: "Standard ads appear on this Advertise page. Premium ads can also be placed inside specific county and town pages as Sponsored Local Businesses.",
          },
          { tag: "H3", text: "What does each ad include?" },
          {
            tag: "P",
            text: "Business name, logo or photo, a short description, and a link to your website or social media. Premium ads may also include larger visuals and enhanced placement.",
          },
          { tag: "H3", text: "How much does it cost?" },
          {
            tag: "P",
            text: "Rates depend on the package and number of towns/counties selected. Contact us for current pricing and availability.",
          },
        ],
      },
    ],
    closingTitle: "Ready to advertise?",
    closingText: "Get your business in front of South Jersey homeowners and buyers today.",
    closingLink: { label: "Contact About Advertising", href: "/contact" },
  },
};
