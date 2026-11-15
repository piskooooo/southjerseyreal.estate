import type { InsightArticleContent } from "./insights";

export const gclGuidePath = "/insights/glassboro-camden-line";
export const gclMapId = "19dnfwAOP-Hf17G2_YofYS-AfnuotSmY";
export const gclMapViewerUrl = `https://www.google.com/maps/d/viewer?mid=${gclMapId}`;
export const gclMapEmbedUrl = `https://www.google.com/maps/d/embed?mid=${gclMapId}&ehbc=2E312F`;
export const legacyGoogleMapsDisclosure = "Google Maps Platform supplies public Google review content on the About page. When a visitor chooses to load those reviews, review data and reviewer profile images may be requested from Google. Google's handling of information is described in the Google Privacy Policy.";
export const googleMapsDisclosure = `${legacyGoogleMapsDisclosure} Google My Maps supplies the optional interactive GCL map. It loads only when you select Load interactive map; Google may receive your IP address and use cookies when it loads. Loading a map does not change your Google Analytics consent choice on this site.`;
const reviewedDate = "2026-11-15";

export const gclGuide: InsightArticleContent = {
  author: "Arthur Pisko Jr.",
  category: "South Jersey transportation",
  eyebrow: "Gloucester and Camden counties",
  title: "Glassboro–Camden Line: Proposed Stations and Route Map",
  summary: "Explore the proposed GCL station locations and the questions to ask when researching a property near the rail corridor.",
  notice: "The GCL is a proposed project, not an operating passenger service. Map markers are a reference for research, not surveyed boundaries or final station entrances. Plans can change.",
  publishedDate: reviewedDate,
  reviewedDate,
  readingTime: "5 minute read",
  sections: [
    {
      heading: "What is the Glassboro–Camden Line?",
      paragraphs: [
        "The Glassboro–Camden Line, or GCL, is a proposed 18-mile passenger rail connection between Glassboro and Camden, following an existing rail corridor through Gloucester and Camden counties.",
        "This guide brings the proposed stops together with an interactive map and a property research checklist. Use it to orient yourself, then check the project team's current documents for the details that matter to a particular address.",
      ],
      checklist: [],
    },
    {
      heading: "Explore the proposed station map",
      paragraphs: [
        "Select a marker to see its station label. The map is provided here as a location reference; the official GCL project website remains the source for project status and station design information.",
        "A pin does not establish the location of a future platform, entrance, parking lot, pedestrian crossing, or property acquisition. Compare the map with the latest station plans before drawing conclusions about a nearby property.",
      ],
      map: "gcl",
      checklist: [],
    },
    {
      heading: "Proposed stops, from Camden to Glassboro",
      paragraphs: [
        "The supplied map and the official project's online route diagram identify the following stops in this order, checked November 15, 2026. These are proposed station labels, not a list of every municipality along the corridor.",
      ],
      orderedList: [
        "Walter Rand Transportation Center", "Lanning Square", "South Camden", "Gloucester City",
        "Crown Point Road", "Red Bank Avenue", "Woodbury", "Woodbury Heights", "Mantua", "Sewell",
        "Mantua Pitman", "Pitman", "North Glassboro", "Glassboro",
      ],
      checklist: [],
    },
    {
      heading: "Project status and what can change",
      paragraphs: [
        "As checked November 15, 2026, the official project timeline still identifies preliminary engineering design as the current phase. The station page says station design is not complete. These pages describe plans and estimates; they do not establish an operating service or a confirmed opening date.",
        "Before relying on a station location, service pattern, parking arrangement, or construction timeline, review the latest official project updates and ask the project team about any unresolved detail. Recheck time-sensitive information when you are making a property decision.",
      ],
      checklist: [],
    },
    {
      heading: "Researching a property near the corridor",
      paragraphs: [
        "Start with how you would use the property today. Then treat possible future rail access as a separate question to investigate. A map marker alone cannot establish a usable walking route, a reliable commute, or an effect on a home's value.",
        "For a specific address, compare the parcel and street layout with current project plans. Municipal records, title and survey documents, and project-team responses answer different questions; keep the source and date with each finding.",
      ],
      checklist: [
        "Check the actual route to a proposed entrance, including sidewalks, crossings, barriers, and access needs.",
        "Verify proposed parking, bicycle access, drop-off areas, and connecting transportation rather than assuming they will be available.",
        "Review the address's relationship to tracks, crossings, planned works, and any published noise or vibration studies.",
        "Ask the project team about any mapped right-of-way, easement, or acquisition question; have an appropriate professional review property-specific records.",
        "Keep current transportation options and costs separate from estimates for a service that has not opened.",
      ],
    },
    {
      heading: "Keep the map in context",
      paragraphs: [
        "Use the official sources below to follow changes to the project. The embedded map can be updated independently of this article, so its markers and the dated station list should be compared with the latest project materials.",
        "This is general educational information, not a survey, appraisal, legal opinion, or prediction of future property values. For a property-specific concern, identify the question first and take it to the project team, municipality, or appropriate licensed professional.",
      ],
      checklist: [],
    },
  ],
  sources: [
    { tag: "SOURCE", text: "GCL project — overview and proposed station diagram", href: "https://glassborocamdenline.com/", accessed: reviewedDate },
    { tag: "SOURCE", text: "GCL project — station design information", href: "https://glassborocamdenline.com/stations/", accessed: reviewedDate },
    { tag: "SOURCE", text: "GCL project — timeline and preliminary engineering", href: "https://glassborocamdenline.com/project-timeline/", accessed: reviewedDate },
    { tag: "SOURCE", text: "Google My Maps — GCL location reference", href: gclMapViewerUrl, accessed: reviewedDate },
  ],
  relatedLinks: [
    { label: "Research a South Jersey property", href: "/insights/researching-a-south-jersey-property" },
    { label: "Check municipal records, permits, and zoning", href: "/insights/municipal-records-permits-and-zoning" },
    { label: "Explore Gloucester County", href: "/gloucester-county" },
    { label: "Explore Camden County", href: "/camden-county" },
    { label: "Contact Arthur", href: "/contact" },
  ],
};
