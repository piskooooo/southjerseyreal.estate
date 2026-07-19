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
      "New Jersey works because it is compact, connected, and far more varied than outsiders expect. North Jersey pulls from New York, South Jersey pulls from Philadelphia and the shore, and the state fits older cities, commuter corridors, suburbs, farms, the Pine Barrens, Delaware River communities, and Atlantic barrier islands into a remarkably small area.",
    supportText: `This is an editorial comparison of geography, culture, transportation, housing, and everyday character, updated July 19, 2026. ${outOfStateServiceDisclosure}`,
    panels: [
      {
        id: "nj-vs-ny",
        title: "NJ vs. NY",
        summary: "City access and cultural energy without treating every New Jersey decision as an extension of New York City.",
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
          {
            heading: "Housing and daily life",
            primary:
              "New Jersey offers dense city neighborhoods, rail-oriented suburbs, older downtown boroughs, shore properties, postwar subdivisions, and lower-density rural areas within reach of several employment centers.",
            secondary:
              "New York pairs an intensely urban and expensive global city with Long Island, commuter suburbs, upstate cities, college towns, agricultural regions, lake communities, and mountain areas spread across a much larger state.",
            takeaway:
              "New Jersey's advantage is not one housing type or price point; it is the number of different daily settings packed between two major cities and the coast.",
          },
        ],
        bottomLine:
          "New Jersey offers proximity to New York's jobs and culture without simply functioning as an extension of the city or accepting a city-versus-upstate split.",
      },
      {
        id: "nj-vs-pa",
        title: "NJ vs. PA",
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
          {
            heading: "Housing and everyday tradeoffs",
            primary:
              "New Jersey's compact municipal map puts shore towns, river communities, older boroughs, suburbs, farms, and major commercial corridors relatively close together, though taxes, insurance, and housing costs vary sharply by address.",
            secondary:
              "Pennsylvania can provide more land and lower housing costs in some regions, but distances between employment centers, amenities, and recreation can be greater outside its major metropolitan areas.",
            takeaway:
              "A useful comparison weighs the whole location: property type, taxes, travel, local services, and access to the places used every week.",
          },
        ],
        bottomLine:
          "Pennsylvania offers enormous geographic range. New Jersey's case is the tighter combination of city access, shore culture, local downtowns, and regional connections.",
      },
      {
        id: "nj-vs-de",
        title: "NJ vs. DE",
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
          {
            heading: "Culture and practical tradeoffs",
            primary:
              "New Jersey has major concert and sports markets nearby, Atlantic City events, boardwalk traditions, diner culture, dense local services, and transportation systems connected with both New York and Philadelphia.",
            secondary:
              "Delaware has Wilmington arts and business districts, beach-town events, a quieter statewide scale, and tax-free retail shopping, with regional ties to Philadelphia, Baltimore, and the Delmarva Peninsula.",
            takeaway:
              "Delaware emphasizes simplicity and smaller scale; New Jersey emphasizes access, variety, and a larger network of distinct local places.",
          },
        ],
        bottomLine:
          "Delaware is compact and coastal. New Jersey adds more metropolitan, municipal, cultural, transportation, and shoreline variety.",
      },
    ],
    closingTitle: "The New Jersey takeaway",
    closingText:
      "New Jersey is not one-note. City skylines, older boroughs, farms, forests, river towns, diners, boardwalks, commuter routes, and the Atlantic coast can all overlap within one state. South Jersey adds its own Philadelphia-facing, agricultural, Pinelands, bay, and shore identity to that larger mix.",
    closingLink: {
      label: "Compare North and South Jersey",
      href: "/why-south-jersey",
    },
  },
  "/why-south-jersey": {
    path: "/why-south-jersey",
    title: "Why South Jersey?",
    intro:
      "South Jersey has its own rhythm. Philadelphia, the Delaware River, the Pine Barrens, farms, Atlantic City, Delaware Bay, boardwalks, and barrier-island shore towns all shape a region that feels different from the dense New York orbit of North Jersey. It is not one market or one uniform landscape, and that variety is the point.",
    supportText:
      "This editorial comparison covers geography, pace, food, sports, transportation, economic anchors, culture, and real estate, updated July 19, 2026. North Jersey and South Jersey are informal descriptions, so county and municipality names remain more precise.",
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
        id: "south-vs-north-economy",
        title: "Economy, culture, and change",
        summary: "Tourism, healthcare, education, agriculture, logistics, and local downtowns compared with the northern metropolitan economy.",
        primaryLabel: "South Jersey",
        secondaryLabel: "North Jersey",
        topics: [
          {
            heading: "Economic anchors",
            primary:
              "South Jersey combines Philadelphia-oriented employment with healthcare systems, colleges, logistics corridors, agriculture, food production, shore tourism, and Atlantic City's casino, convention, and entertainment economy.",
            secondary:
              "North Jersey has deeper ties to New York City employment as well as finance, pharmaceuticals, technology, ports, logistics, higher education, healthcare, and corporate headquarters.",
            takeaway:
              "The north is more tightly integrated with a global city; the south draws from several smaller economic systems and seasonal industries.",
          },
          {
            heading: "Culture and reinvestment",
            primary:
              "Atlantic City projects, shore-town reinvestment, farm markets, wineries, breweries, arts districts, historic downtowns, and local festivals continue to reshape how South Jersey presents itself.",
            secondary:
              "Jersey City, Newark, Hoboken, Montclair, and other northern centers have experienced their own cycles of redevelopment, arts investment, new housing, and downtown growth.",
            takeaway:
              "Both regions change, but South Jersey's strongest identity comes from developing its own places rather than copying the New York model.",
          },
        ],
        bottomLine:
          "North Jersey has the larger metropolitan engine; South Jersey combines regional employment with shore, agricultural, logistics, healthcare, education, and local-town economies.",
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
      "South Jersey is not simply the quieter half of the state or a less expensive substitute for North Jersey. It is a collection of river, suburban, Pinelands, agricultural, bay, and shore communities with a shared Philadelphia-facing culture and sharply different local real estate. The county and town pages show how those pieces differ.",
    closingLink: {
      label: "Explore South Jersey Counties",
      href: "/counties",
    },
  },
};
