export type ContentBlock = {
  tag: string;
  text: string;
  href?: string;
  accessed?: string;
  type?: string;
  placeholder?: string;
};

export type ImageAsset = {
  src: string;
  alt: string;
  storagePath?: string;
  thumbnail?: string;
  thumbnailPath?: string;
};

export type PageSection = {
  id: string;
  kind?: "hero" | "profile" | "intro" | "town" | "support" | "action" | "promo" | "standard";
  blocks: ContentBlock[];
  images: ImageAsset[];
};

export type SitePage = {
  path: string;
  title: string;
  sections: PageSection[];
};
