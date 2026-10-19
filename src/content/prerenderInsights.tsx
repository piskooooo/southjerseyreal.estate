import { renderToStaticMarkup } from "react-dom/server";
import { InsightArticlePage, InsightsIndexPage } from "../components/Layouts";
import type { ManagedPageDocument } from "./siteEditor";

// Build-only rendering shares the public layout and accepted published content.
// React omits click handlers, leaving ordinary links usable before JavaScript.
const navigate = () => {};

export const renderInsights = (document: ManagedPageDocument): string => {
  if (document.insightIndex) {
    return renderToStaticMarkup(<InsightsIndexPage content={document.insightIndex} navigate={navigate} />);
  }
  if (document.insightArticle) {
    return renderToStaticMarkup(<InsightArticlePage article={document.insightArticle} navigate={navigate} />);
  }
  return "";
};
