import { communityInformationNote } from "./compliance";
import { isTownSection, townSectionAnchor, townSectionKey } from "./countySections";
import { cleanSourceHref } from "./sourceNotes";
import type { ContentBlock, SitePage } from "./types";

const htmlEscape = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const renderSourceNote = (block: ContentBlock) => {
  const href = cleanSourceHref(block.href);
  const title = htmlEscape(block.text);
  return `<p class="content-source-note"><strong>Source:</strong> ${href
    ? `<a href="${htmlEscape(href)}" target="_blank" rel="noreferrer">${title}</a>`
    : title}${block.accessed ? `<span>Accessed ${htmlEscape(block.accessed)}.</span>` : ""}</p>`;
};

// The build supplies the accepted published document, not a separate town list.
// Keep this text readable without JavaScript; interactive cards replace it on startup.
export const renderCountyCommunities = (page: SitePage) => {
  if (!page.path.endsWith("-county")) return "";
  const towns = page.sections.flatMap((section, index) => isTownSection(section, index) ? [{ section, index }] : []);
  const profiles = towns.map(({ section, index }) => {
    const [heading, summary] = section.blocks;
    const headingTag = heading?.tag === "H2" ? "h2" : "h3";
    const sources = section.blocks.filter((block) => block.tag === "SOURCE");
    return `<article class="prerendered-community-profile" id="${htmlEscape(townSectionAnchor(section, index))}" data-town-card-key="${htmlEscape(townSectionKey(section, index))}">
        <div class="town-card-summary">
          <${headingTag}>${htmlEscape(heading?.text || "Community")}</${headingTag}>
          ${summary && summary.tag !== "SOURCE" ? `<p>${htmlEscape(summary.text)}</p>` : ""}
        </div>
        ${sources.map(renderSourceNote).join("\n        ")}
      </article>`;
  });
  if (!profiles.length) return "";
  return `<section class="section text-section" aria-label="Community profiles">
      <div>
        <h2>Community profiles</h2>
        <details class="town-directory">
          <summary>Jump to a town</summary>
          <nav aria-label="Town directory"><ul>${towns.map(({ section, index }) => `<li><a href="#${htmlEscape(townSectionAnchor(section, index))}">${htmlEscape(section.blocks[0]?.text || "Community")}</a></li>`).join("")}</ul></nav>
        </details>
        ${profiles.join("\n        ")}
      </div>
    </section>
    <aside class="section community-information-disclaimer" aria-label="Community information note">
      <p>${htmlEscape(communityInformationNote)} <a href="/disclaimer">Website disclosures</a>.</p>
    </aside>`;
};
