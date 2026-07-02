import type { SitePage } from "./types";

const actionBlocks = [
  { tag: "H2", text: "Thinking of Selling?" },
  {
    tag: "P",
    text: "I help South Jersey homeowners price strategically, prep efficiently, and market aggressively for maximum exposure and strong offers. From photography and listing launch to negotiations and closing, you'll have clear guidance at every step across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
  },
  { tag: "P", text: "Get Your Free Home Value Estimate" },
  { tag: "H2", text: "Looking to Buy?" },
  {
    tag: "P",
    text: "Tell me your budget and must-haves, and I'll send a curated list of homes, plus new listings and price drops as they hit the market. I'll guide you on neighborhoods, financing next steps, private showings, and winning offers so you can buy confidently in South Jersey.",
  },
  { tag: "P", text: "Get Your Custom Home List" },
];

export const pageOverrides: SitePage[] = [
  {
    path: "/partners",
    title: "Trusted Real Estate Partners in South Jersey | Lenders, Title, Inspectors - South Jersey Real Estate",
    sections: [
      {
        id: "partners-intro",
        blocks: [
          { tag: "H1", text: "Partnerships & Local Resources" },
          {
            tag: "P",
            text: "We work with trusted professionals who play a direct role in the real estate process. These are service providers I feel confident recommending to my clients as part of a smooth home buying or selling experience.",
          },
          {
            tag: "P",
            text: "Important: This page is for real estate-related partners only. If you are a local business outside of the transaction process (restaurants, shops, gyms, etc.), please see our Advertising page.",
          },
        ],
        images: [],
      },
      {
        id: "partner-types",
        blocks: [
          { tag: "H2", text: "Who We Partner With" },
          { tag: "P", text: "Title companies" },
          { tag: "P", text: "Mortgage professionals" },
          { tag: "P", text: "Home inspectors" },
          { tag: "P", text: "Contractors & repair services" },
          { tag: "P", text: "Photographers & other transaction-related providers" },
          { tag: "P", text: "Brokerage and agent tools" },
        ],
        images: [],
      },
      {
        id: "brokerage-tools",
        blocks: [
          { tag: "H2", text: "Brokerage & Agent Tools" },
          { tag: "H3", text: "The Plum Real Estate Group" },
          {
            tag: "P",
            text: "Arthur Pisko Jr. is affiliated with The Plum Real Estate Group, a New Jersey real estate brokerage supporting buyers, sellers, and agents.",
          },
          { tag: "A", text: "Visit The Plum Real Estate Group", href: "https://www.theplumrealestategroup.com/" },
          { tag: "H3", text: "HomeBase CRM" },
          {
            tag: "P",
            text: "HomeBase CRM is a self-hostable real estate CRM built for solo agents to organize contacts, pipeline stages, follow-ups, imports, exports, and client notes.",
          },
          { tag: "A", text: "Visit HomeBase CRM", href: "https://homebasecrm.com" },
        ],
        images: [],
      },
      {
        id: "mortgage-partners",
        blocks: [
          { tag: "H2", text: "Current Partners" },
          { tag: "H3", text: "Mortgage Professionals" },
          { tag: "H4", text: "Sam Hamilton" },
          { tag: "P", text: "Movement Mortgage - movement.com" },
          { tag: "P", text: "Email: sam.hamilton@movement.com" },
          { tag: "P", text: "Office: (856) 366-8585" },
          { tag: "H4", text: "Jill Granato" },
          { tag: "P", text: "AnnieMac - jillgranato.annie-mac.com" },
          { tag: "P", text: "Email: jgranato@annie-mac.com" },
          { tag: "P", text: "Office: (856) 252-1194 - Mobile: (609) 221-6608" },
          { tag: "H4", text: "Matt Ziegert" },
          { tag: "P", text: "Team Ziegert / CrossCountry Mortgage - ccm.com" },
          { tag: "P", text: "Email: matt.ziegert@ccm.com" },
          { tag: "P", text: "Office: 973-823-1300 - Mobile: (201) 563-7404" },
          { tag: "H4", text: "Terri Parker" },
          { tag: "P", text: "The Parker Team / CrossCountry Mortgage - crosscountrymortgage.com" },
          { tag: "P", text: "Email: Terri.Parker@ccm.com" },
          { tag: "P", text: "Office: (856) 776-6886" },
          { tag: "H4", text: "Drew Whipple" },
          { tag: "P", text: "OceanFirst Bank - oceanfirst.mymortgage-online.com" },
          { tag: "P", text: "Email: awhipple@oceanfirst.com" },
          { tag: "P", text: "Office: (856) 924-1682" },
        ],
        images: [],
      },
      {
        id: "title-partners",
        blocks: [
          { tag: "H2", text: "Title Companies" },
          { tag: "H3", text: "Atlantic County" },
          {
            tag: "P",
            text: "Cape Atlantic Title Agency, LLC - Linwood, NJ - capeatlantictitle.com",
          },
          {
            tag: "P",
            text: "Local experts offering full title and settlement services with a focus on personalized client care.",
          },
          { tag: "H3", text: "Burlington County" },
          {
            tag: "P",
            text: "Two Rivers Title Company, LLC - Willingboro, NJ - tworiverstitle.com",
          },
          {
            tag: "P",
            text: "Trusted by buyers, sellers, and agents across New Jersey for reliable title and escrow services.",
          },
          { tag: "H3", text: "Camden County" },
          { tag: "P", text: "SJS Title, LLC - Cherry Hill, NJ - sjstitle.com" },
          {
            tag: "P",
            text: "Our go-to partner for smooth, efficient closings in Camden County and beyond.",
          },
          { tag: "H3", text: "Cape May County" },
          {
            tag: "P",
            text: "The Title Company of Jersey - Cape May Court House, NJ - tcjonline.com",
          },
          {
            tag: "P",
            text: "Serving Cape May and nearby counties with decades of experience in real estate transactions.",
          },
          { tag: "H3", text: "Cumberland County" },
          { tag: "P", text: "Signature Title Agency - Millville, NJ - signaturetitleagency.com" },
          {
            tag: "P",
            text: "Known for professionalism and timely processing in Cumberland and surrounding counties.",
          },
          { tag: "H3", text: "Gloucester County" },
          { tag: "P", text: "Surety Title Company, LLC - Woodbury, NJ - suretytitle.com" },
          {
            tag: "P",
            text: "A full-service agency that has built a strong reputation among agents and lenders alike.",
          },
          { tag: "H3", text: "Salem County" },
          { tag: "P", text: "Foundation Title, LLC - Woodstown, NJ - foundationtitle.com" },
          {
            tag: "P",
            text: "Reliable and responsive service covering rural and residential closings in Salem County.",
          },
        ],
        images: [],
      },
      {
        id: "partners-faq",
        blocks: [
          { tag: "H2", text: "Partners FAQ" },
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
        ],
        images: [],
      },
      {
        id: "partners-disclaimer",
        blocks: [
          { tag: "H2", text: "Important Disclaimer" },
          {
            tag: "P",
            text: "These are professionals and businesses I trust and recommend as a convenience to my clients. I do not receive any compensation or other benefits for listing anyone here. Clients are always free to use any service provider of their choice.",
          },
        ],
        images: [],
      },
      {
        id: "partners-promos",
        blocks: [
          { tag: "H3", text: "Looking to Partner With Us?" },
          {
            tag: "P",
            text: "We collaborate with professionals directly involved in the real estate process, including title companies, lenders, inspectors, and contractors.",
          },
          { tag: "P", text: "Learn More on Our Partners Page" },
          { tag: "H3", text: "Advertise With Us" },
          {
            tag: "P",
            text: "Are you a local business serving South Jersey residents, such as a restaurant, retail shop, or community service provider? Promote your business on our county and town pages to reach homeowners and buyers in the area.",
          },
          { tag: "P", text: "See Advertising Opportunities" },
        ],
        images: [],
      },
      {
        id: "partners-action",
        blocks: actionBlocks,
        images: [],
      },
    ],
  },
  {
    path: "/advertise",
    title: "Advertise | Boost Your Local Visibility Today - South Jersey Real Estate",
    sections: [
      {
        id: "advertise-intro",
        blocks: [
          { tag: "H1", text: "Advertise With Us" },
          {
            tag: "P",
            text: "Promote your business to South Jersey homeowners, buyers, and sellers through targeted local exposure.",
          },
          {
            tag: "P",
            text: "Important: This page is for non-real estate businesses only. Real estate settlement service providers (title companies, lenders, inspectors, appraisers, etc.) are not eligible for advertising. If you're in real estate services, please see our Partnerships page.",
          },
        ],
        images: [],
      },
      {
        id: "advertise-why",
        blocks: [
          { tag: "H2", text: "Why Advertise Here?" },
          {
            tag: "P",
            text: "Your business is seen by active local buyers and sellers browsing homes in South Jersey.",
          },
          {
            tag: "P",
            text: "Visibility on highly targeted county and town pages, not just a generic directory.",
          },
          {
            tag: "P",
            text: "Showcase your business alongside the communities you serve.",
          },
        ],
        images: [],
      },
      {
        id: "advertise-eligibility",
        blocks: [
          { tag: "H2", text: "Eligibility" },
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
        images: [],
      },
      {
        id: "advertise-options",
        blocks: [
          { tag: "H2", text: "Advertising Options" },
          { tag: "H3", text: "Standard Placement" },
          { tag: "P", text: "Listing on the Advertise With Us page." },
          {
            tag: "P",
            text: "Includes your business name, logo or image, a short description, and a link to your website or social media.",
          },
          { tag: "H3", text: "Premium Placement" },
          { tag: "P", text: "Everything in Standard, plus:" },
          {
            tag: "P",
            text: "Featured as a Sponsored Local Business inside the town/county pages most relevant to your audience.",
          },
          { tag: "P", text: "Larger visual presence and priority positioning." },
        ],
        images: [],
      },
      {
        id: "advertise-process",
        blocks: [
          { tag: "H2", text: "How It Works" },
          { tag: "P", text: "Contact us at advertise@southjerseyreal.estate." },
          {
            tag: "P",
            text: "We'll share available packages, pricing, and placement options.",
          },
          {
            tag: "P",
            text: "Submit your business info, including logo, description, link, and target towns/counties.",
          },
          { tag: "P", text: "We review and confirm placement." },
          { tag: "P", text: "Your ad goes live within X business days." },
        ],
        images: [],
      },
      {
        id: "advertise-faq",
        blocks: [
          { tag: "H2", text: "Advertising FAQ" },
          { tag: "H3", text: "Q: Where will my ad appear?" },
          {
            tag: "P",
            text: "A: Standard ads appear on this Advertise page. Premium ads can also be placed inside specific county and town pages as Sponsored Local Businesses.",
          },
          { tag: "H3", text: "Q: What does each ad include?" },
          {
            tag: "P",
            text: "A: Business name, logo or photo, a short description, and a link to your website or social media. Premium ads may also include larger visuals and enhanced placement.",
          },
          { tag: "H3", text: "Q: How much does it cost?" },
          {
            tag: "P",
            text: "A: Rates depend on the package and number of towns/counties selected. Contact us for current pricing and availability.",
          },
        ],
        images: [],
      },
      {
        id: "advertise-ready",
        blocks: [
          { tag: "H2", text: "Ready to Advertise?" },
          {
            tag: "P",
            text: "Get your business in front of South Jersey homeowners and buyers today. advertise@southjerseyreal.estate",
          },
        ],
        images: [],
      },
    ],
  },
];
