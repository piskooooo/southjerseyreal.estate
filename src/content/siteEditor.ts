import { comparisonGuides, type ComparisonGuide } from "./comparisonGuides";
import { compliance } from "./compliance";
import { generatedPages } from "./generatedSiteData";
import {
  connectNav,
  countyNav,
  footerLinkGroups,
  socialLinks,
} from "./navigation";
import { pageOverrides } from "./pageOverrides";
import { resourcePages, type ResourcePage } from "./resourcePages";
import { defaultImage, seoEntries } from "./seo";
import type { ContentBlock, ImageAsset, PageSection, SitePage } from "./types";

export const SITEWIDE_CONTENT_KEY = "__sitewide__";

export type SiteLink = {
  label: string;
  path: string;
};

export type SocialLink = {
  label: string;
  icon: string;
  href: string;
};

export type SitewideContent = {
  brandName: string;
  header: {
    countiesLabel: string;
    countiesPath: string;
    connectLabel: string;
    connectPath: string;
    contactLabel: string;
    countyLinks: SiteLink[];
    connectLinks: SiteLink[];
    socialLinks: SocialLink[];
  };
  footer: {
    brandName: string;
    copyright: string;
    creatorCredit: string;
    creatorHref: string;
    cookieSettingsLabel: string;
    linkGroups: Array<{ label: string; links: SiteLink[] }>;
  };
  privacyBanner: {
    message: string;
    policyLabel: string;
    declineLabel: string;
    acceptLabel: string;
  };
};

export type NewsletterContent = {
  eyebrow: string;
  heading: string;
  introduction: string;
  topics: string[];
  note: string;
  confirmationMessage: string;
  submitLabel: string;
  submittingLabel: string;
  followupHeading: string;
  followupCopy: string;
  followupLabel: string;
  followupPath: string;
};

export type ManagedPageDocument = {
  page: SitePage;
  seo: {
    title: string;
    description: string;
    image: string;
  };
  comparisonGuide?: ComparisonGuide;
  resourcePage?: ResourcePage;
  newsletter?: NewsletterContent;
};

export type ManagedContent = SitewideContent | ManagedPageDocument;

export type ManagedContentRecord = {
  pageKey: string;
  draft: ManagedContent;
  savedDraft: ManagedContent;
  published: ManagedContent;
  publishedAt: string;
  updatedAt: string;
  exists: boolean;
};

export const sitewideSeed: SitewideContent = {
  brandName: "South Jersey Real Estate Guide",
  header: {
    countiesLabel: "Counties",
    countiesPath: "/counties",
    connectLabel: "Connect",
    connectPath: "/connect",
    contactLabel: "Contact",
    countyLinks: countyNav.map((item) => ({ ...item })),
    connectLinks: connectNav.map((item) => ({ ...item })),
    socialLinks: socialLinks.map((item) => ({ ...item })),
  },
  footer: {
    brandName: "South Jersey Real Estate Guide",
    copyright: "© 2026 South Jersey Real Estate Guide",
    creatorCredit: "Website created and maintained by Fat Cat Finance, LLC.",
    creatorHref: "https://fatcat.finance",
    cookieSettingsLabel: "Cookie Settings",
    linkGroups: footerLinkGroups.map((group) => ({
      label: group.label,
      links: group.links.map((item) => ({ ...item })),
    })),
  },
  privacyBanner: {
    message: "This site uses optional analytics cookies to understand visits and improve local real estate content.",
    policyLabel: "Privacy Policy",
    declineLabel: "Decline",
    acceptLabel: "Accept Analytics",
  },
};

const newsletterSeed: NewsletterContent = {
  eyebrow: "South Jersey market updates",
  heading: "Newsletter",
  introduction: "A weekly real estate email for South New Jersey homeowners, buyers, and locals who want to keep an eye on the market without digging through scattered reports.",
  topics: [
    "Local housing trends",
    "County and town notes",
    "Buyer and seller tips",
    "New site guides",
  ],
  note: "No spam. No daily blast. Just useful local notes focused on South Jersey once a week.",
  confirmationMessage: "Your email is confirmed. Welcome to the newsletter.",
  submitLabel: "Sign Up",
  submittingLabel: "Signing up...",
  followupHeading: "Want something more specific?",
  followupCopy: "For a property-specific list, value discussion, or question about a move, use the contact page to start an inquiry.",
  followupLabel: "Start the Conversation",
  followupPath: "/contact",
};

const defaultActionBlocks: ContentBlock[] = [
  { tag: "H2", text: "Thinking about buying or selling in South Jersey?" },
  {
    tag: "P",
    text: "Arthur helps New Jersey buyers and sellers plan, communicate, and manage the steps of a real-estate transaction across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
  },
  { tag: "A", text: "Start the Conversation", href: "/contact" },
];

const aboutProfileCta: ContentBlock = {
  tag: "A",
  text: "Start a Conversation",
  href: "/contact",
};

const homeLightHeroImage: ImageAsset = {
  src: "/assets/home-light-hero-beach-sunrise.jpg",
  alt: "Sunrise over a South Jersey beach with ocean waves, glowing sky, and shoreline in the foreground.",
};

const isLegacyActionSection = (section: PageSection) => {
  const headings = section.blocks
    .filter((block) => block.tag === "H2")
    .map((block) => block.text);
  return headings.includes("Thinking of Selling?") && headings.includes("Looking to Buy?");
};

const withImageMetadata = (page: SitePage): SitePage => ({
  ...page,
  sections: page.sections.map((section, index) => {
    let kind: PageSection["kind"] = section.kind || "standard";
    if (!section.kind) {
      if (isLegacyActionSection(section)) kind = "action";
      else if (page.path === "/" && index === 0) kind = "hero";
      else if (page.path === "/" && index === 1) kind = "profile";
      else if (page.path === "/about" && index === 0) kind = "profile";
      else if (page.path === "/contact" && index === 0) kind = "intro";
      else if (page.path === "/contact") kind = "promo";
      else if (page.path.endsWith("-county") && index === 0) kind = "intro";
      else if (page.path.endsWith("-county") && section.images.length > 0) kind = "town";
      else if (page.path.endsWith("-county") && section.images.length === 0) kind = "support";
    }

    const sourceBlocks = kind === "action"
      ? defaultActionBlocks
      : section.blocks;
    const blocks = sourceBlocks.map((block) => ({ ...block }));
    if (page.path === "/about" && index === 0 && !blocks.some((block) => block.tag === "A")) {
      const firstDetailHeading = blocks.findIndex((block) => block.tag === "H3");
      blocks.splice(firstDetailHeading < 0 ? blocks.length : firstDetailHeading, 0, { ...aboutProfileCta });
    }

    const sourceImages: ImageAsset[] = page.path === "/" && index === 0 && section.images.length < 2
      ? [...section.images, homeLightHeroImage]
      : section.images;

    return {
      ...section,
      kind,
      blocks,
      images: sourceImages.map((image) => ({
        ...image,
        storagePath: image.storagePath || "",
        thumbnail: image.thumbnail || image.src,
        thumbnailPath: image.thumbnailPath || "",
      })),
    };
  }),
});

const canonicalSourcePages = new Map(
  [...generatedPages, ...pageOverrides].map((page) => [page.path, page]),
);

const placeholderPage = (path: string, title: string): SitePage => ({
  path,
  title,
  sections: [],
});

const keepRenderedSections = (page: SitePage, hasStructuredBody: boolean): SitePage => {
  let allowedKinds: PageSection["kind"][] | undefined;
  if (page.path === "/") allowedKinds = ["hero", "profile", "action"];
  else if (page.path === "/about") allowedKinds = ["profile", "action"];
  else if (page.path === "/contact") allowedKinds = ["intro", "promo"];
  else if (page.path === "/newsletter") allowedKinds = [];
  else if (hasStructuredBody) allowedKinds = ["action"];
  if (!allowedKinds) return page;
  return {
    ...page,
    sections: page.sections.filter((section) => allowedKinds.includes(section.kind)),
  };
};

export const managedPageSeeds: ManagedPageDocument[] = seoEntries.map((entry) => {
  const source = canonicalSourcePages.get(entry.path)
    || placeholderPage(entry.path, entry.title);
  const comparisonGuide = comparisonGuides[entry.path];
  const resourcePage = resourcePages[entry.path];
  return {
    page: keepRenderedSections(withImageMetadata(source), Boolean(comparisonGuide || resourcePage)),
    seo: {
      title: entry.title,
      description: entry.description,
      image: entry.image || defaultImage,
    },
    ...(comparisonGuide
      ? { comparisonGuide: structuredClone(comparisonGuide) }
      : {}),
    ...(resourcePage
      ? { resourcePage: structuredClone(resourcePage) }
      : {}),
    ...(entry.path === "/newsletter"
      ? { newsletter: structuredClone(newsletterSeed) }
      : {}),
  };
});

export const managedPageSeedByPath = new Map(
  managedPageSeeds.map((document) => [document.page.path, document]),
);

export const managedContentSeeds = new Map<string, ManagedContent>([
  [SITEWIDE_CONTENT_KEY, sitewideSeed],
  ...managedPageSeeds.map((document) => [document.page.path, document] as const),
]);

export const managedContentKeys = [...managedContentSeeds.keys()];

const isObject = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === "object" && !Array.isArray(value)
);

function mergeSeedValues(values: unknown[]): unknown {
  const defined = values.filter((value) => value !== undefined);
  if (!defined.length) return undefined;
  if (defined.every(Array.isArray)) return defined.flatMap((value) => value as unknown[]);
  if (defined.every(isObject)) {
    const objects = defined as Array<Record<string, unknown>>;
    const keys = new Set(objects.flatMap((value) => Object.keys(value)));
    return Object.fromEntries([...keys].map((key) => [
      key,
      mergeSeedValues(objects.map((value) => value[key])),
    ]));
  }
  return structuredClone(defined[0]);
}

type ObjectArraySchema = {
  allowedKeys: string[];
  keySeeds: Map<string, unknown>;
  requiredKeys: Set<string>;
};

const objectArraySchemaCache = new WeakMap<unknown[], ObjectArraySchema>();

function objectArraySchema(seed: unknown[], objectSeeds: Array<Record<string, unknown>>) {
  const cached = objectArraySchemaCache.get(seed);
  if (cached) return cached;
  const allowedKeys = [...new Set(objectSeeds.flatMap((item) => Object.keys(item)))];
  const schema = {
    allowedKeys,
    keySeeds: new Map(allowedKeys.map((key) => [
      key,
      mergeSeedValues(objectSeeds.map((candidate) => candidate[key])),
    ])),
    requiredKeys: new Set(allowedKeys.filter((key) => objectSeeds.every((item) => key in item))),
  };
  objectArraySchemaCache.set(seed, schema);
  return schema;
}

function normalizeAgainstSeed(value: unknown, seed: unknown): unknown {
  if (typeof seed === "string") return typeof value === "string" ? value : seed;
  if (typeof seed === "number") return typeof value === "number" && Number.isFinite(value) ? value : seed;
  if (typeof seed === "boolean") return typeof value === "boolean" ? value : seed;
  if (Array.isArray(seed)) {
    if (!Array.isArray(value)) return structuredClone(seed);
    if (!seed.length) return value.slice(0, 100);
    const objectSeeds = seed.filter(isObject);
    if (objectSeeds.length === seed.length) {
      const { allowedKeys, keySeeds, requiredKeys } = objectArraySchema(seed, objectSeeds);
      return value.slice(0, 100).map((item, index) => {
        if (!isObject(item)) {
          return normalizeAgainstSeed(item, seed[index] ?? seed[0]);
        }
        const samePosition = isObject(seed[index]) ? seed[index] : undefined;
        const result: Record<string, unknown> = {};
        for (const key of allowedKeys) {
          const hasValue = key in item;
          if (!hasValue && !requiredKeys.has(key)) continue;
          const keySeed = keySeeds.get(key);
          result[key] = hasValue
            ? normalizeAgainstSeed(item[key], keySeed)
            : structuredClone(samePosition?.[key] ?? keySeed);
        }
        return result;
      });
    }
    const itemSeed = mergeSeedValues(seed);
    return value.slice(0, 100).map((item) => normalizeAgainstSeed(item, itemSeed));
  }
  if (isObject(seed)) {
    if (!isObject(value)) return structuredClone(seed);
    return Object.fromEntries(
      Object.entries(seed).map(([key, child]) => [
        key,
        normalizeAgainstSeed(value[key], child),
      ]),
    );
  }
  return structuredClone(seed);
}

export function normalizeManagedContent(pageKey: string, value: unknown): ManagedContent {
  const seed = managedContentSeeds.get(pageKey);
  if (!seed) throw new Error("The website database returned an unknown page.");
  return normalizeAgainstSeed(value, seed) as ManagedContent;
}

const linkFieldNames = new Set(["creatorHref", "followupPath", "href", "path", "phoneHref"]);
const imageFieldNames = new Set(["image", "src", "thumbnail"]);

function isAllowedManagedUrl(value: string, imageOnly: boolean) {
  const candidate = value.trim();
  if (!candidate) return true;
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return true;
  try {
    const url = new URL(candidate);
    if (url.username || url.password) return false;
    if (imageOnly) return url.protocol === "https:";
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const communityPageKeys = new Set([
  "/counties",
  "/atlantic-county",
  "/burlington-county",
  "/camden-county",
  "/cape-may-county",
  "/cumberland-county",
  "/gloucester-county",
  "/salem-county",
  "/why-new-jersey",
  "/why-south-jersey",
]);

const prohibitedMarketingClaims = [
  /\bfamily[- ]friendly\b/i,
  /\b(?:perfect|ideal|great|best) (?:for|place|community|neighbou?rhood|town|schools?)\b/i,
  /\b(?:young professionals?|retirees?|empty nesters?)\b/i,
  /\b(?:safe(?:st)? neighbou?rhoods?|low crime|crime[- ]free)\b/i,
  /\b(?:top[- ]rated|excellent|good|strong) schools?\b/i,
  /\b(?:prestigious|exclusive|up[- ]and[- ]coming)\b/i,
  /\b(?:guaranteed|maximum exposure|winning offers?)\b/i,
];

const unsupportedCommunityFacts = [
  /\bmedian (?:sale|sold|home|listing) price\b/i,
  /\baverage property tax\b/i,
  /\b(?:crime|school) ratings?\b/i,
  /\b\d+(?:\.\d+)?%\b/,
];

const allTextValues = (value: unknown) => {
  const values: string[] = [];
  const visit = (current: unknown) => {
    if (typeof current === "string") {
      values.push(current);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (isObject(current)) Object.values(current).forEach(visit);
  };
  visit(value);
  return values;
};

function assertComplianceCopy(pageKey: string, value: ManagedContent) {
  const textValues = allTextValues(value);
  const combinedText = textValues.join("\n");

  if (!compliance.realtorMembershipVerified && textValues.some((text) => /REALTOR(?:®|\(R\))?/i.test(text))) {
    throw new Error("REALTOR membership has not been verified. Remove the REALTOR mark or document the credential before publishing.");
  }

  if (!compliance.idxListingsEnabled && /\b(?:homes? for sale|search homes?)\b/i.test(combinedText)) {
    throw new Error("Listing-search language cannot be published before an approved IDX integration is enabled.");
  }

  const prohibited = prohibitedMarketingClaims.find((pattern) => textValues.some((text) => pattern.test(text)));
  if (prohibited) {
    throw new Error(`Remove subjective, steering, or performance language matching ${prohibited} before publishing.`);
  }

  if (communityPageKeys.has(pageKey)) {
    const unsupported = unsupportedCommunityFacts.find((pattern) => textValues.some((text) => pattern.test(text)));
    if (unsupported) {
      throw new Error(`Document and date an authoritative source before publishing community data matching ${unsupported}.`);
    }
  }

  if (pageKey === "/partners" && !compliance.providerDirectoryVerificationComplete) {
    const seedResource = (managedContentSeeds.get(pageKey) as ManagedPageDocument | undefined)?.resourcePage;
    const candidateResource = (value as ManagedPageDocument).resourcePage;
    if (JSON.stringify(candidateResource) !== JSON.stringify(seedResource)) {
      throw new Error("Provider-directory changes are locked until identity, credentials, material relationships, referral arrangements, and paid status are verified.");
    }
  }

  const requiredMarkers: Partial<Record<string, string[]>> = {
    "/advertise": ["Sponsored", "Paid advertisement", "material relationship"],
    "/faq": ["Broker compensation is not set by law and is fully negotiable", "You are free to choose any provider"],
    "/privacy-policy": ["Cloudflare", "Supabase", "Brevo", "Google Analytics", "not loaded until Analytics is accepted"],
    "/disclaimer": ["No agency relationship", "You are free to choose any provider", compliance.brokerLegalName],
    "/terms-of-service": ["appropriate written agreement", compliance.brokerLegalName],
  };
  const missingMarker = requiredMarkers[pageKey]?.find((marker) => !combinedText.includes(marker));
  if (missingMarker) {
    throw new Error(`Required compliance language is missing from ${pageKey}: ${missingMarker}`);
  }
}

export function validateManagedContentForPublish(pageKey: string, value: ManagedContent) {
  const visit = (current: unknown, path: string[]) => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, [...path, String(index + 1)]));
      return;
    }
    if (!isObject(current)) return;

    const src = typeof current.src === "string" ? current.src.trim() : "";
    if (src && (typeof current.alt !== "string" || !current.alt.trim())) {
      throw new Error(`Add descriptive alt text before publishing the image at ${path.join(" → ") || "this page"}.`);
    }

    for (const [key, child] of Object.entries(current)) {
      if (typeof child === "string" && (linkFieldNames.has(key) || imageFieldNames.has(key))) {
        const imageOnly = imageFieldNames.has(key);
        if (!isAllowedManagedUrl(child, imageOnly)) {
          throw new Error(`${fieldLabelForValidation(key)} at ${[...path, key].join(" → ")} must use an internal path or an allowed ${imageOnly ? "HTTPS image" : "HTTP(S), email, or phone"} link.`);
        }
      }
      visit(child, [...path, key]);
    }
  };

  visit(value, []);
  assertComplianceCopy(pageKey, value);
}

function fieldLabelForValidation(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

export function contentRecordFromRow(row: Record<string, unknown>): ManagedContentRecord {
  const pageKey = String(row.page_key || row.pageKey || "");
  const seed = managedContentSeeds.get(pageKey);
  if (!seed) throw new Error("The website database returned an unknown page.");
  const draft = normalizeManagedContent(pageKey, row.draft_content ?? row.draft ?? seed);
  return {
    pageKey,
    draft,
    savedDraft: structuredClone(draft),
    published: normalizeManagedContent(pageKey, row.published_content ?? row.published ?? seed),
    publishedAt: String(row.published_at || row.publishedAt || ""),
    updatedAt: String(row.updated_at || row.updatedAt || ""),
    exists: true,
  };
}

export function seedContentRecord(pageKey: string): ManagedContentRecord {
  const seed = managedContentSeeds.get(pageKey);
  if (!seed) throw new Error("This website page is not editable.");
  return {
    pageKey,
    draft: structuredClone(seed),
    savedDraft: structuredClone(seed),
    published: structuredClone(seed),
    publishedAt: "",
    updatedAt: "",
    exists: false,
  };
}

export type PublicSiteContent = {
  sitewide: SitewideContent;
  pages: Map<string, ManagedPageDocument>;
};

export function seedPublicSiteContent(): PublicSiteContent {
  return {
    sitewide: sitewideSeed,
    pages: new Map(managedPageSeeds.map((document) => [
      document.page.path,
      document,
    ])),
  };
}

export async function loadPublishedSiteContent(pageKey?: string): Promise<PublicSiteContent> {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const fallback = seedPublicSiteContent();
  if (!supabaseUrl || !publishableKey) return fallback;

  try {
    const requestedKeys = pageKey && managedContentSeeds.has(pageKey)
      ? [SITEWIDE_CONTENT_KEY, pageKey]
      : managedContentKeys;
    const query = new URLSearchParams({
      select: "page_key,published_content,published_at",
      published_at: "not.is.null",
      page_key: `in.(${requestedKeys.join(",")})`,
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/site_pages?${query}`, {
      headers: { apikey: publishableKey },
    });
    if (!response.ok) return fallback;
    const rows = await response.json() as Array<Record<string, unknown>>;
    for (const row of rows) {
      const pageKey = String(row.page_key || "");
      if (!managedContentSeeds.has(pageKey)) continue;
      const published = normalizeManagedContent(pageKey, row.published_content);
      try {
        assertComplianceCopy(pageKey, published);
      } catch {
        continue;
      }
      if (pageKey === SITEWIDE_CONTENT_KEY) {
        fallback.sitewide = published as SitewideContent;
      } else {
        fallback.pages.set(pageKey, published as ManagedPageDocument);
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}
