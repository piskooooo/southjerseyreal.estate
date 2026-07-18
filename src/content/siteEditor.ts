import { comparisonGuides, type ComparisonGuide } from "./comparisonGuides";
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
    connectLabel: string;
    contactLabel: string;
    countyLinks: SiteLink[];
    connectLinks: SiteLink[];
    socialLinks: SocialLink[];
  };
  footer: {
    brandName: string;
    copyright: string;
    licenseDisclosure: string;
    phoneLabel: string;
    phoneHref: string;
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
  brandName: "South Jersey Real Estate",
  header: {
    countiesLabel: "Counties",
    connectLabel: "Connect",
    contactLabel: "Contact",
    countyLinks: countyNav.map((item) => ({ ...item })),
    connectLinks: connectNav.map((item) => ({ ...item })),
    socialLinks: socialLinks.map((item) => ({ ...item })),
  },
  footer: {
    brandName: "South Jersey Real Estate",
    copyright: "© 2026 South Jersey Real Estate",
    licenseDisclosure: "Arthur Pisko Jr., NJ Real Estate License #2187170.",
    phoneLabel: "856-493-7501",
    phoneHref: "tel:8564937501",
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
    "📈 Local housing trends",
    "📍 County and town notes",
    "🏠 Buyer and seller tips",
    "🧭 New site guides",
  ],
  note: "No spam. No daily blast. Just useful local notes focused on South Jersey once a week.",
  confirmationMessage: "Your email is confirmed. Welcome to the newsletter.",
  submitLabel: "Sign Up",
  submittingLabel: "Signing up...",
  followupHeading: "Want something more specific?",
  followupCopy: "If you want a custom home list, a home value estimate, or direct advice about a move, the contact page is still the best place to start.",
  followupLabel: "Start the Conversation",
  followupPath: "/contact",
};

const defaultActionBlocks: ContentBlock[] = [
  { tag: "H2", text: "Thinking about buying or selling in South Jersey?" },
  {
    tag: "P",
    text: "I help homeowners price strategically, prep efficiently, and market aggressively, and I help buyers find the right homes, understand neighborhoods, and submit strong offers. Whether you’re just exploring or ready to move forward, you’ll get clear guidance from start to finish across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
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
    let kind: PageSection["kind"] = "standard";
    if (isLegacyActionSection(section)) kind = "action";
    else if (page.path === "/" && index === 0) kind = "hero";
    else if (page.path === "/" && index === 1) kind = "profile";
    else if (page.path === "/about" && index === 0) kind = "profile";
    else if (page.path === "/contact" && index === 0) kind = "intro";
    else if (page.path === "/contact") kind = "promo";
    else if (page.path.endsWith("-county") && index === 0) kind = "intro";
    else if (page.path.endsWith("-county") && section.images.length > 0) kind = "town";
    else if (page.path.endsWith("-county") && section.images.length === 0) kind = "support";

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

const linkFieldNames = new Set(["followupPath", "href", "path", "phoneHref"]);
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

export function validateManagedContentForPublish(value: ManagedContent) {
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
