import type { InsightArticleContent, InsightCard } from "./insights";
import { normalizeRoutePath, siteUrl } from "./seo";

export type GuideFinderEntry = {
  card: InsightCard;
  index: number;
  searchText: string;
};

type GuideDocument = {
  page: { path: string };
  insightArticle?: InsightArticleContent;
};

const canonicalOrigin = new URL(siteUrl).origin;
const normalizeSearch = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

function articlePath(href: string): string | undefined {
  const candidate = href.trim();
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return undefined;
  if ((!candidate.startsWith("/") || candidate.startsWith("//")) && !/^https?:\/\//i.test(candidate)) return undefined;
  try {
    const url = new URL(candidate, siteUrl);
    if (url.origin !== canonicalOrigin || url.username || url.password) return undefined;
    return normalizeRoutePath(url.pathname);
  } catch {
    return undefined;
  }
}

function articleText(article: InsightArticleContent): string[] {
  return [
    article.title,
    article.summary,
    article.category,
    article.author,
    article.eyebrow,
    article.notice,
    article.readingTime,
    article.publishedDate,
    article.reviewedDate,
    ...article.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.checklist]),
    ...article.sources.map((source) => source.text),
    ...article.relatedLinks.map((link) => link.label),
  ];
}

export function buildGuideFinderEntries(
  cards: readonly InsightCard[],
  pages: Iterable<GuideDocument>,
): GuideFinderEntry[] {
  const articles = new Map(Array.from(pages, (document) => [document.page.path, document.insightArticle]));
  return cards.map((card, index) => {
    const path = articlePath(card.href);
    const article = path ? articles.get(path) : undefined;
    return {
      card,
      index,
      searchText: normalizeSearch([
        card.title,
        card.summary,
        card.category,
        ...(article ? articleText(article) : []),
      ].join(" ")),
    };
  });
}

export function findGuideFinderEntries(
  entries: readonly GuideFinderEntry[],
  query: string,
): GuideFinderEntry[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return [...entries];
  const tokens = normalized.split(" ");
  return entries.filter((entry) => tokens.every((token) => entry.searchText.includes(token)));
}
