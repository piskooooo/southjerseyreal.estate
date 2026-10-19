import { createManagedContentRuntime } from "./managedContentRuntime";
import { countySiteContent } from "./countySiteContent";

// Builds and the private editor keep the complete synchronous content API.
const runtime = createManagedContentRuntime(countySiteContent);

export { SITEWIDE_CONTENT_KEY, sitewideSeed } from "./managedContentRuntime";
export type {
  SiteLink,
  SocialLink,
  SitewideContent,
  NewsletterContent,
  ManagedPageDocument,
  ManagedContent,
  ManagedContentRecord,
  PublicSiteContent,
} from "./managedContentRuntime";

export const {
  managedPageSeeds,
  managedPageSeedByPath,
  managedContentSeeds,
  managedContentKeys,
  normalizeManagedContent,
  validateManagedContentForPublish,
  contentRecordFromRow,
  seedContentRecord,
  seedPublicSiteContent,
  loadPublishedSiteContent,
} = runtime;
