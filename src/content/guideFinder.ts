import type { InsightArticleContent, InsightCard } from "./insights";
import { insightSectionId } from "./insightSections";
import { isPublicFragmentId } from "../urlPrivacy";
import { normalizeRoutePath, siteUrl } from "./seo";

type GuidePassage = {
  text: string;
  searchText: string;
  sectionIndex?: number;
};

type GuideSection = {
  heading: string;
  id: string;
  searchText: string;
  uniqueId: boolean;
};

export type GuideFinderEntry = {
  card: InsightCard;
  index: number;
  searchText: string;
  passages: readonly GuidePassage[];
  sections: readonly GuideSection[];
  sectionBaseHref?: string;
};

export type GuideFinderMatch = {
  excerpt: string;
  sectionHref?: string;
  sectionHeading?: string;
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

function articleDestination(href: string): URL | undefined {
  const candidate = href.trim();
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return undefined;
  if ((!candidate.startsWith("/") || candidate.startsWith("//")) && !/^https?:\/\//i.test(candidate)) return undefined;
  try {
    const url = new URL(candidate, siteUrl);
    if (url.origin !== canonicalOrigin || url.username || url.password) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function articleMetadata(article: InsightArticleContent): string[] {
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
  ];
}

export function buildGuideFinderEntries(
  cards: readonly InsightCard[],
  pages: Iterable<GuideDocument>,
): GuideFinderEntry[] {
  const articles = new Map(Array.from(pages, (document) => [document.page.path, document.insightArticle]));
  return cards.map((card, index) => {
    const destination = articleDestination(card.href);
    const path = destination && normalizeRoutePath(destination.pathname);
    const article = path ? articles.get(path) : undefined;
    const passages: GuidePassage[] = [];
    const addPassage = (text: string, sectionIndex?: number) => {
      passages.push({ text, searchText: normalizeSearch(text), sectionIndex });
    };
    [card.title, card.summary, card.category].forEach((text) => addPassage(text));
    const sections: GuideSection[] = [];
    if (article) {
      articleMetadata(article).forEach((text) => addPassage(text));
      const sectionIds = article.sections.map((section, sectionIndex) => insightSectionId(section.heading, sectionIndex));
      article.sections.forEach((section, sectionIndex) => {
        const text = [section.heading, ...section.paragraphs, ...section.checklist];
        text.forEach((passage) => addPassage(passage, sectionIndex));
        sections.push({
          heading: section.heading,
          id: sectionIds[sectionIndex],
          searchText: normalizeSearch(text.join(" ")),
          uniqueId: sectionIds.filter((id) => id === sectionIds[sectionIndex]).length === 1,
        });
      });
      [...article.sources.map((source) => source.text), ...article.relatedLinks.map((link) => link.label)]
        .forEach((text) => addPassage(text));
    }
    return {
      card,
      index,
      searchText: normalizeSearch(passages.map((passage) => passage.text).join(" ")),
      passages,
      sections,
      sectionBaseHref: article && destination ? `${destination.pathname}${destination.search}` : undefined,
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

type MatchSpan = { start: number; end: number; token: string };

/** Map normalized matches back to literal source spans, including combining marks. */
function sourceMatchSpans(text: string, normalized: string, tokens: readonly string[]): MatchSpan[] {
  const boundaries = [0];
  for (const character of text) boundaries.push(boundaries[boundaries.length - 1] + character.length);
  const positions = new Map<number, number>();
  const sourceBoundary = (normalizedOffset: number) => {
    const cached = positions.get(normalizedOffset);
    if (cached !== undefined) return cached;
    let first = 1;
    let last = boundaries.length - 1;
    while (first < last) {
      const middle = Math.floor((first + last) / 2);
      if (normalizeSearch(text.slice(0, boundaries[middle])).length > normalizedOffset) last = middle;
      else first = middle + 1;
    }
    positions.set(normalizedOffset, first);
    return first;
  };
  const spans: MatchSpan[] = [];
  for (const token of tokens) {
    let offset = normalized.indexOf(token);
    while (offset !== -1) {
      const start = boundaries[sourceBoundary(offset) - 1];
      let end = boundaries[sourceBoundary(offset + token.length - 1)];
      while (end < text.length && /\p{M}/u.test(String.fromCodePoint(text.codePointAt(end)!))) {
        end += String.fromCodePoint(text.codePointAt(end)!).length;
      }
      spans.push({ start, end, token });
      offset = normalized.indexOf(token, offset + 1);
    }
  }
  return spans.sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Keep the most distinct terms together; compact spans leave room for context. */
function focusedMatchSpan(spans: readonly MatchSpan[], budget: number): { start: number; end: number } {
  let best = spans[0];
  let bestCoverage = 0;
  for (let index = 0; index < spans.length; index += 1) {
    const first = spans[index];
    if (first.end - first.start > budget) continue;
    const tokenEnds = new Map<string, number>();
    for (let next = index; next < spans.length && spans[next].start - first.start < budget; next += 1) {
      const span = spans[next];
      if (span.end - first.start <= budget) {
        tokenEnds.set(span.token, Math.min(tokenEnds.get(span.token) ?? Infinity, span.end));
      }
    }
    const end = Math.max(...tokenEnds.values());
    const coverage = tokenEnds.size;
    if (coverage > bestCoverage || (coverage === bestCoverage && end - first.start < best.end - best.start)) {
      best = { ...first, end };
      bestCoverage = coverage;
    }
  }
  return best;
}

function passageExcerpt(passage: GuidePassage, tokens: readonly string[]): string {
  const text = passage.text.trim();
  const maximum = 220;
  if (text.length <= maximum) return text;
  const normalized = normalizeSearch(text);
  const budget = maximum - 2;
  const focus = focusedMatchSpan(sourceMatchSpans(text, normalized, tokens), budget);
  const words = Array.from(text.matchAll(/\S+/gu), (match) => ({ start: match.index, end: match.index + match[0].length }));
  let first = words.findIndex((word) => word.end > focus.start);
  let last = words.findIndex((word) => word.end >= focus.end);

  // Ordinary prose clips only between words. An exceptionally long single word
  // may require a partial word, while preserving the entire matching span if it fits.
  if (words[last].end - words[first].start > budget) {
    const context = Math.max(0, budget - (focus.end - focus.start));
    let start = Math.max(0, focus.start - Math.floor(context / 2));
    let end = Math.min(text.length, start + budget);
    start = Math.max(0, end - budget);
    if (/^[\uDC00-\uDFFF]$/.test(text[start])) start += 1;
    if (/^[\uD800-\uDBFF]$/.test(text[end - 1])) end -= 1;
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  }

  while (true) {
    const canExpandLeft = first > 0 && words[last].end - words[first - 1].start <= budget;
    const canExpandRight = last + 1 < words.length && words[last + 1].end - words[first].start <= budget;
    if (!canExpandLeft && !canExpandRight) break;
    if (canExpandLeft && (!canExpandRight || focus.start - words[first].start <= words[last].end - focus.end)) first -= 1;
    else last += 1;
  }
  const start = words[first].start;
  const end = words[last].end;
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export function getGuideFinderMatch(entry: GuideFinderEntry, query: string): GuideFinderMatch | undefined {
  const normalized = normalizeSearch(query);
  if (!normalized) return undefined;
  const tokens = [...new Set(normalized.split(" "))];
  if (!tokens.every((token) => entry.searchText.includes(token))) return undefined;

  const fullSections = new Set(entry.sections.flatMap((section, index) => (
    tokens.every((token) => section.searchText.includes(token)) ? [index] : []
  )));
  let best: GuidePassage | undefined;
  let bestCoverage = 0;
  for (const passage of entry.passages) {
    if (fullSections.size && (passage.sectionIndex === undefined || !fullSections.has(passage.sectionIndex))) continue;
    const coverage = tokens.filter((token) => passage.searchText.includes(token)).length;
    const prefersSection = coverage === bestCoverage && best?.sectionIndex === undefined && passage.sectionIndex !== undefined;
    if (coverage > bestCoverage || (coverage > 0 && prefersSection)) {
      best = passage;
      bestCoverage = coverage;
    }
  }
  if (!best) return undefined;
  const match: GuideFinderMatch = { excerpt: passageExcerpt(best, tokens) };
  if (best.sectionIndex !== undefined && fullSections.has(best.sectionIndex)) {
    const section = entry.sections[best.sectionIndex];
    if (section.uniqueId && entry.sectionBaseHref && isPublicFragmentId(section.id)) {
      match.sectionHref = `${entry.sectionBaseHref}#${section.id}`;
      match.sectionHeading = section.heading;
    }
  }
  return match;
}
