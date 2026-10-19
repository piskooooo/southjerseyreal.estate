import { countyNav } from "./navigation";
import { normalizeRoutePath, seoEntries } from "./seo";
import {
  createManagedContentRuntime,
  type CountySiteContent,
  type PublicSiteContent,
} from "./managedContentRuntime";

export type {
  ManagedPageDocument,
  PublicSiteContent,
  SitewideContent,
} from "./managedContentRuntime";

export const knownPublicPaths: ReadonlySet<string> = new Set(seoEntries.map((entry) => entry.path));
const countyPaths: ReadonlySet<string> = new Set(countyNav.map((county) => county.path));
export const isKnownPublicPath = (path: string) => knownPublicPaths.has(normalizeRoutePath(path));

type PublicContentOptions = {
  loadCountyContent?: () => Promise<CountySiteContent>;
};

/** A separate instance lets tests control chunk timing and failure without network writes. */
export function createPublicSiteContent({
  loadCountyContent = () => import("./countySiteContent").then((module) => module.countySiteContent),
}: PublicContentOptions = {}) {
  let runtime = createManagedContentRuntime();
  let countyReady = false;
  let countyPromise: Promise<void> | undefined;
  const needsCountyContent = (path: string) => {
    const normalized = normalizeRoutePath(path);
    return normalized === "/counties" || countyPaths.has(normalized);
  };
  const isPublicContentReady = (path: string) => !needsCountyContent(path) || countyReady;

  const preparePublicContent = (path: string): Promise<void> => {
    if (isPublicContentReady(path)) return Promise.resolve();
    if (!countyPromise) {
      countyPromise = Promise.resolve().then(loadCountyContent).then((countyContent) => {
        const next = createManagedContentRuntime(countyContent);
        // Do not mark a partial/malformed county payload ready or render a
        // placeholder for a known county route.
        if ([...countyPaths].some((county) => !next.managedPageSeedByPath.has(county))) {
          throw new Error("County content could not be prepared.");
        }
        runtime = next;
        countyReady = true;
      }).catch((error: unknown) => {
        countyPromise = undefined;
        throw error;
      });
    }
    return countyPromise;
  };

  return {
    preparePublicContent,
    isPublicContentReady,
    isKnownPublicPath,
    knownPublicPaths,
    seedPublicSiteContent: (): PublicSiteContent => runtime.seedPublicSiteContent(),
    async loadPublishedSiteContent(pageKey?: string): Promise<PublicSiteContent> {
      // An unscoped load retains the former complete-content contract.
      await preparePublicContent(pageKey === undefined ? "/counties" : pageKey);
      return runtime.loadPublishedSiteContent(pageKey);
    },
  };
}

const publicContent = createPublicSiteContent();
export const {
  preparePublicContent,
  isPublicContentReady,
  seedPublicSiteContent,
  loadPublishedSiteContent,
} = publicContent;
