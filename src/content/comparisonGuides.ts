import { outOfStateServiceDisclosure } from "./compliance";

export type ComparisonTopic = {
  heading: string;
  primary: string;
  secondary: string;
  takeaway: string;
};

export type ComparisonPanel = {
  id: string;
  title: string;
  summary: string;
  primaryLabel: string;
  secondaryLabel: string;
  topics: ComparisonTopic[];
  bottomLine: string;
};

export type ComparisonGuide = {
  path: string;
  title: string;
  intro: string;
  supportText: string;
  panels: ComparisonPanel[];
  closingTitle: string;
  closingText: string;
  closingLink: {
    label: string;
    href: string;
  };
};

export const comparisonGuides: Record<string, ComparisonGuide> = {
  "/why-new-jersey": {
    path: "/why-new-jersey",
    title: "Why New Jersey?",
    intro:
      "New Jersey fits shore towns, Pine Barrens, farmland, older cities, commuter corridors, and two major metropolitan orbits into a remarkably compact state. Its character comes from those contrasts, not from any single version of the Jersey stereotype.",
    supportText: `Editorial comparison updated July 19, 2026. ${outOfStateServiceDisclosure}`,
    panels: [
      {
        id: "nj-vs-ny",
        title: "New Jersey and New York",
        summary: "A compact crossroads beside a much larger state and global city.",
        primaryLabel: "New Jersey",
        secondaryLabel: "New York",
        topics: [
          {
            heading: "Geography and scale",
            primary:
              "New Jersey runs from the New York Harbor region to the Delaware Bay and Atlantic coast. Dense cities, suburban corridors, the Pinelands, farms, and barrier islands sit within relatively short distances of one another.",
            secondary:
              "New York stretches from New York City and Long Island through the Hudson Valley, central and western cities, and the Adirondacks. Its regions operate at a much larger geographic scale.",
            takeaway:
              "New Jersey's defining feature is how quickly its landscape and local identity can change.",
          },
          {
            heading: "Metropolitan pull",
            primary:
              "North Jersey is closely tied to New York City, while much of South Jersey looks toward Philadelphia, Atlantic City, the Delaware River, and the shore.",
            secondary:
              "New York City is the state's dominant global center, while upstate regions have their own economic, cultural, and transportation networks.",
            takeaway:
              "New Jersey sits between major markets instead of revolving around only one of them.",
          },
          {
            heading: "Everyday character",
            primary:
              "Diners, boardwalks, shore traffic, neighborhood downtowns, farm stands, and fierce local loyalties are all part of the state's ordinary rhythm.",
            secondary:
              "New York pairs the cultural scale of New York City with very different upstate city, lake, mountain, and rural traditions.",
            takeaway:
              "New York has greater scale; New Jersey has an unusually concentrated mix of places and influences.",
          },
        ],
        bottomLine:
          "New Jersey offers proximity to New York without simply functioning as an extension of it.",
      },
      {
        id: "nj-vs-pa",
        title: "New Jersey and Pennsylvania",
        summary: "A coastal, compact state beside a larger inland neighbor.",
        primaryLabel: "New Jersey",
        secondaryLabel: "Pennsylvania",
        topics: [
          {
            heading: "Regional shape",
            primary:
              "New Jersey's Atlantic coastline, Delaware River communities, major highways, and dense municipal map keep many parts of the state closely connected.",
            secondary:
              "Pennsylvania spans Philadelphia, Pittsburgh, the Poconos, the Susquehanna Valley, Appalachian communities, and broad agricultural regions.",
            takeaway:
              "Pennsylvania changes across long distances; New Jersey compresses many regional experiences into a smaller footprint.",
          },
          {
            heading: "The Philadelphia connection",
            primary:
              "Camden, Burlington, Gloucester, and Salem County communities have long-standing economic, transportation, sports, and cultural ties to Philadelphia.",
            secondary:
              "Philadelphia anchors southeastern Pennsylvania, but the state's identity extends far beyond the metropolitan area.",
            takeaway:
              "South Jersey and Philadelphia share a regional culture even though the Delaware River marks a state line.",
          },
          {
            heading: "Coast and recreation",
            primary:
              "The Jersey Shore, Delaware Bay, Pinelands, state forests, and river corridors shape recreation and seasonal patterns across the state.",
            secondary:
              "Pennsylvania's outdoor identity centers more heavily on mountains, forests, lakes, rivers, and inland state parks.",
            takeaway:
              "The contrast is less city versus suburb than coast versus a much larger inland landscape.",
          },
        ],
        bottomLine:
          "New Jersey and Pennsylvania overlap culturally around Philadelphia, but their geography produces different daily patterns.",
      },
      {
        id: "nj-vs-de",
        title: "New Jersey and Delaware",
        summary: "Two coastal states with very different scale and regional reach.",
        primaryLabel: "New Jersey",
        secondaryLabel: "Delaware",
        topics: [
          {
            heading: "Size and variety",
            primary:
              "New Jersey contains several large population centers, an extensive municipal network, major ports, multiple transit systems, and a long chain of distinct shore towns.",
            secondary:
              "Delaware is smaller, with Wilmington and New Castle County in the north and more rural and coastal areas farther south.",
            takeaway:
              "Delaware is easier to cross; New Jersey presents more regional variation within one state.",
          },
          {
            heading: "Coastal identity",
            primary:
              "Cape May, the Wildwoods, Ocean City, Atlantic City, barrier islands, boardwalks, and working bay communities all contribute to New Jersey's shore culture.",
            secondary:
              "Lewes, Rehoboth Beach, Dewey Beach, Bethany Beach, and Fenwick Island give Delaware its own closely connected coastal circuit.",
            takeaway:
              "Both states are shaped by seasonal coastlines, but New Jersey's shore is larger and more varied from town to town.",
          },
          {
            heading: "Regional connections",
            primary:
              "New Jersey connects directly with New York City and Philadelphia while also facing the Atlantic and Delaware Bay.",
            secondary:
              "Delaware's strongest regional connections run through the Wilmington, Philadelphia, Baltimore, and Delmarva corridors.",
            takeaway:
              "The states share a bay and a coastal outlook, but they occupy different positions in the Northeast corridor.",
          },
        ],
        bottomLine:
          "Delaware is compact and coastal; New Jersey adds more metropolitan, municipal, and shoreline variety.",
      },
    ],
    closingTitle: "The New Jersey takeaway",
    closingText:
      "New Jersey's appeal is not one universal lifestyle. It is the ability to move between city skylines, older boroughs, farms, forests, river towns, and the Atlantic coast without leaving the state. South Jersey adds its own Philadelphia-facing and shore-centered identity to that larger mix.",
    closingLink: {
      label: "Compare North and South Jersey",
      href: "/why-south-jersey",
    },
  },
  "/why-south-jersey": {
    path: "/why-south-jersey",
    title: "Why South Jersey?",
    intro:
      "South Jersey has its own rhythm, shaped by Philadelphia, the Delaware River, the Pine Barrens, farmland, Atlantic City, and the shore. It is not a single market or one uniform landscape, and that variety is the point of exploring it county by county.",
    supportText:
      "Editorial comparison updated July 19, 2026. North Jersey and South Jersey are informal regional descriptions, so county and municipality names are more precise.",
    panels: [
      {
        id: "south-vs-north-geography",
        title: "Landscape and regional pull",
        summary: "Philadelphia, the shore, and the Pinelands compared with the New York City orbit.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Regional anchor",
            primary:
              "South Jersey generally looks toward Philadelphia, the Delaware River, Atlantic City, Cape May, and the Atlantic shore. This site focuses on Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
            secondary:
              "North Jersey generally looks toward New York City, Newark, Jersey City, the Hudson River, and the state's northern transportation and employment corridors.",
            takeaway:
              "The cultural dividing line is often about which metropolitan area and transportation network shape daily life.",
          },
          {
            heading: "Landscape",
            primary:
              "Barrier islands, Delaware Bay marshes, working farms, the Pine Barrens, river towns, and suburban corridors all appear across the region.",
            secondary:
              "The north combines dense cities and inner suburbs with the Highlands, Ramapo Mountains, reservoirs, river valleys, and older commuter towns.",
            takeaway:
              "Neither half of New Jersey is one landscape, but the south has a stronger coastal, agricultural, and Pinelands presence.",
          },
        ],
        bottomLine:
          "South Jersey faces Philadelphia and the Atlantic; North Jersey faces New York and the Hudson region.",
      },
      {
        id: "south-vs-north-culture",
        title: "Food, sports, and local identity",
        summary: "The details people argue about are often the details that make a place recognizable.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Food shorthand",
            primary:
              "Pork roll, hoagies, shore seafood, farm stands, blueberries, tomatoes, diners, and Wawa all show up in the region's everyday vocabulary.",
            secondary:
              "Taylor ham, bagels, pizza, Italian delis, diners, and a dense mix of international food traditions are common North Jersey reference points.",
            takeaway:
              "The familiar pork roll versus Taylor ham argument is really a shorthand for two regional identities.",
          },
          {
            heading: "Sports and media",
            primary:
              "Philadelphia teams have a strong following across South Jersey, while Atlantic City and shore media add their own regional focus.",
            secondary:
              "New York teams and New York City media have greater influence across much of North Jersey.",
            takeaway:
              "State borders matter less than the city whose games, news, and events fill the local conversation.",
          },
          {
            heading: "Seasonal traditions",
            primary:
              "Boardwalk summers, shore traffic, beach tags, local festivals, farm markets, and trips down the shore are woven into South Jersey's calendar.",
            secondary:
              "North Jersey's seasonal patterns connect more strongly with New York events, northern downtowns, the Highlands, and travel toward the Hudson Valley and nearby mountain regions.",
            takeaway:
              "South Jersey's identity is especially visible where shore and agricultural traditions overlap.",
          },
        ],
        bottomLine:
          "Food and sports do not define a property, but they reveal which neighboring city and landscape shape the region.",
      },
      {
        id: "south-vs-north-transportation",
        title: "Transportation and access",
        summary: "Different networks serve the Philadelphia and New York sides of the state.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Transit network",
            primary:
              "PATCO links Camden County with Center City Philadelphia, NJ Transit runs the Atlantic City Rail Line, and regional bus routes connect additional communities.",
            secondary:
              "NJ Transit rail and bus networks, PATH, ferries, and Amtrak connections tie many northern communities to New York City and Newark.",
            takeaway:
              "Transit coverage is highly address-specific in both regions, but each network points toward a different metropolitan center.",
          },
          {
            heading: "Road network",
            primary:
              "The Atlantic City Expressway, Garden State Parkway, New Jersey Turnpike, Interstate 295, Route 55, and Delaware River bridges carry much of the region's highway traffic.",
            secondary:
              "The Turnpike, Parkway, Interstates 78, 80, 280, and 287, Hudson crossings, and local arterials serve the denser northern network.",
            takeaway:
              "A route map can look simple; actual travel depends on the address, time, tolls, parking, and seasonal demand.",
          },
        ],
        bottomLine:
          "South Jersey's network is organized around Philadelphia, the shore, and major highway corridors.",
      },
      {
        id: "south-vs-north-real-estate",
        title: "Real estate and built environment",
        summary: "Property types and transaction questions change across both regions.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Housing and settlement patterns",
            primary:
              "The region includes older walkable boroughs, postwar suburbs, rural lots, newer subdivisions, shore houses, condominiums, farms, and small cities.",
            secondary:
              "The north includes dense urban neighborhoods, commuter suburbs, multifamily housing, condominiums, older industrial cities, and lower-density communities toward the Highlands.",
            takeaway:
              "Regional labels are less useful than comparing the actual property type, municipality, and block.",
          },
          {
            heading: "Location-specific research",
            primary:
              "Coastal flood exposure, wells and septic systems, Pinelands rules, farmland, municipal utilities, associations, and seasonal conditions can all matter depending on the address.",
            secondary:
              "Transit proximity, urban zoning, multifamily use, parking, municipal services, flood exposure, and association obligations can matter depending on the address.",
            takeaway:
              "The useful questions come from the property and jurisdiction, not a broad claim about which half of the state is better.",
          },
        ],
        bottomLine:
          "South Jersey's real estate is varied enough that county and town research should come before general assumptions.",
      },
    ],
    closingTitle: "The South Jersey takeaway",
    closingText:
      "South Jersey is not simply the quieter half of the state. It is a collection of distinct river, suburban, Pinelands, agricultural, bay, and shore communities with a shared Philadelphia-facing culture. The county guides are the place to see how those pieces differ.",
    closingLink: {
      label: "Explore South Jersey Counties",
      href: "/counties",
    },
  },
};
