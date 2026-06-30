export type ContentBlock = {
  tag: string;
  text: string;
  href?: string;
  type?: string;
  placeholder?: string;
};

export type ImageAsset = {
  src: string;
  alt: string;
};

export type PageSection = {
  id: string;
  blocks: ContentBlock[];
  images: ImageAsset[];
};

export type SitePage = {
  path: string;
  title: string;
  sections: PageSection[];
};
