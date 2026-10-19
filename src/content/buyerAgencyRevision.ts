import type { InsightArticleContent } from "./insights";
import type { ContentBlock } from "./types";

export const buyerGuidePath = "/insights/new-jersey-homebuying-process";
export const previousBuyerReviewDate = "2026-08-10";
export const buyerAgencyReviewDate = "2026-10-19";

export const legacyBuyerAgencyParagraph = "The New Jersey Real Estate Commission identifies four brokerage relationships: seller's agent, buyer's agent, disclosed dual agent, and transaction broker. The Consumer Information Statement explains these roles and the duties attached to each one.";
export const buyerAgencyParagraph = "The New Jersey Real Estate Commission's current Consumer Information Statement describes five brokerage relationships: seller's agent, buyer's agent, disclosed dual agent, designated agent, and transaction broker. These roles carry different duties, so confirm which relationship applies before sharing confidential information.";

export const legacyBuyerAgencySource: ContentBlock = {
  tag: "SOURCE",
  text: "New Jersey Department of Banking and Insurance — Real Estate Consumer Information",
  href: "https://www.nj.gov/dobi/division_consumers/realestate/re_menu.htm",
  accessed: previousBuyerReviewDate,
};

export const buyerAgencySource: ContentBlock = {
  tag: "SOURCE",
  text: "New Jersey Real Estate Commission — Consumer Information Statement on New Jersey Real Estate Relationships",
  href: "https://www.nj.gov/dobi/bulletins/blt24_11Info.pdf",
  accessed: buyerAgencyReviewDate,
};

export function upgradeBuyerAgencyParagraph(article: InsightArticleContent): void {
  let updated = false;
  for (const section of article.sections) {
    section.paragraphs = section.paragraphs.map((paragraph) => {
      if (paragraph !== legacyBuyerAgencyParagraph) return paragraph;
      updated = true;
      return buyerAgencyParagraph;
    });
  }
  if (!updated) return;
  if (article.reviewedDate === previousBuyerReviewDate) article.reviewedDate = buyerAgencyReviewDate;
  article.sources = article.sources.map((source) => (
    source.tag === legacyBuyerAgencySource.tag
    && source.text === legacyBuyerAgencySource.text
    && source.href === legacyBuyerAgencySource.href
    && source.accessed === legacyBuyerAgencySource.accessed
    ? { ...source, ...buyerAgencySource }
    : source
  ));
}
