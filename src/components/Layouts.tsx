import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { trackEvent, trackLinkClick } from "../analytics";
import { comparisonGuides, type ComparisonGuide } from "../content/comparisonGuides";
import { resourcePages, type ResourcePage } from "../content/resourcePages";
import type { ContentBlock, ImageAsset, PageSection, SitePage } from "../content/types";
import { Blocks } from "./Blocks";

type SiteTheme = "dark" | "light";

type PageProps = {
  page: SitePage;
  navigate: (path: string) => void;
};

const LIGHT_MODE_HOME_HERO_IMAGE: ImageAsset = {
  src: "/assets/home-light-hero-beach-sunrise.jpg",
  alt: "Sunrise over a South Jersey beach with ocean waves, glowing sky, and shoreline in the foreground.",
};

const CONTACT_FORM_PLACEHOLDER_TEXT = new Set(["I am looking to...", "Choose a topic"]);

const isActionSection = (section: PageSection) => {
  const headings = section.blocks.filter((block) => block.tag === "H2").map((block) => block.text);
  return headings.includes("Thinking of Selling?") && headings.includes("Looking to Buy?");
};

const TOWN_GRID_COLUMNS = 3;
const townColumnNames = ["left", "center", "right"] as const;
const isTownSection = (section: PageSection, index: number) => index > 0 && section.images.length > 0 && !isActionSection(section);
const isInteractiveTarget = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, label"));
const townSectionKey = (section: PageSection, index: number) => section.id || String(index);
const scrollTownCardIntoView = (key: string) => {
  window.requestAnimationFrame(() => {
    const card = Array.from(document.querySelectorAll<HTMLElement>("[data-town-card-key]")).find((element) => element.dataset.townCardKey === key);
    card?.scrollIntoView({ block: "nearest" });
  });
};

function ActionSection({ navigate }: { section: PageSection; navigate: (path: string) => void }) {
  return (
    <section className="section section-actions section-actions-combined">
      <div>
        <Blocks
          blocks={[
            { tag: "H2", text: "Thinking about buying or selling in South Jersey?" },
            {
              tag: "P",
              text: "I help homeowners price strategically, prep efficiently, and market aggressively, and I help buyers find the right homes, understand neighborhoods, and submit strong offers. Whether you’re just exploring or ready to move forward, you’ll get clear guidance from start to finish across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
            },
            { tag: "A", text: "Start the Conversation", href: "/contact" },
          ]}
          navigate={navigate}
          headingLevel="compact"
        />
      </div>
    </section>
  );
}

function TownCard({
  className = "",
  expanded,
  index,
  navigate,
  onToggle,
  section,
}: {
  className?: string;
  expanded: boolean;
  index: number;
  navigate: (path: string) => void;
  onToggle: () => void;
  section: PageSection;
}) {
  const [headingBlock, summaryBlock, ...detailBlocks] = section.blocks;
  const detailsId = `town-card-details-${section.id || index}`;
  const cardKey = townSectionKey(section, index);
  const hasDetails = detailBlocks.length > 0;
  const visibleBlocks = [headingBlock, summaryBlock].filter(Boolean);
  const image = section.images[0];
  const title = headingBlock?.text || "community";
  const toggleCard = (event: MouseEvent<HTMLElement>) => {
    if (!hasDetails || isInteractiveTarget(event.target)) return;
    onToggle();
  };
  const toggleCardFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasDetails || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    onToggle();
  };

  return (
    <article
      className={`town-card ${expanded ? "is-expanded" : ""} ${className}`.trim()}
      role={hasDetails ? "button" : undefined}
      tabIndex={hasDetails ? 0 : undefined}
      aria-controls={hasDetails ? detailsId : undefined}
      aria-expanded={hasDetails ? expanded : undefined}
      aria-label={hasDetails ? `${expanded ? "Collapse" : "Expand"} ${title} details` : undefined}
      data-town-card-key={cardKey}
      onClick={toggleCard}
      onKeyDown={toggleCardFromKeyboard}
    >
      {image && (
        <div className="town-card-media">
          <img src={image.src} alt={image.alt} />
        </div>
      )}
      <div className="town-card-body">
        <div className="town-card-summary">
          <Blocks blocks={visibleBlocks} navigate={navigate} headingLevel="compact" />
        </div>
        {hasDetails && (
          <>
            <div id={detailsId} className="town-card-details" hidden={!expanded}>
              <Blocks blocks={detailBlocks} navigate={navigate} headingLevel="compact" />
            </div>
            <span className="town-card-indicator" aria-hidden="true">{expanded ? "-" : "+"}</span>
          </>
        )}
      </div>
    </article>
  );
}

function TownGrid({
  sections,
  navigate,
}: {
  sections: Array<{ section: PageSection; index: number }>;
  navigate: (path: string) => void;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set());
  const allExpanded = expandedCards.size === sections.length;
  const rows = sections.reduce<Array<Array<{ key: string; section: PageSection; index: number; column: number }>>>((groups, item, itemIndex) => {
    const rowIndex = Math.floor(itemIndex / TOWN_GRID_COLUMNS);
    const column = itemIndex % TOWN_GRID_COLUMNS;

    if (!groups[rowIndex]) groups[rowIndex] = [];
    groups[rowIndex].push({ ...item, key: townSectionKey(item.section, item.index), column });

    return groups;
  }, []);
  const expandAll = () => setExpandedCards(new Set(sections.map(({ section, index }) => townSectionKey(section, index))));
  const collapseAll = () => setExpandedCards(new Set());
  const toggleCard = (key: string) => {
    const rowKeys = rows.find((row) => row.some((item) => item.key === key))?.map((item) => item.key) || [];
    const isOpening = !expandedCards.has(key);

    setExpandedCards((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        rowKeys.forEach((rowKey) => next.delete(rowKey));
        next.add(key);
      }
      return next;
    });

    if (isOpening) scrollTownCardIntoView(key);
  };

  return (
    <section className="section town-grid-section">
      <div className="town-grid-toolbar">
        <p>{sections.length} communities</p>
        <div>
          <button type="button" onClick={expandAll} disabled={allExpanded}>Expand all</button>
          <button type="button" onClick={collapseAll} disabled={!expandedCards.size}>Collapse all</button>
        </div>
      </div>
      <div className="town-card-grid">
        {rows.map((row, rowIndex) => {
          const expandedInRow = row.filter(({ key }) => expandedCards.has(key));
          const singleExpanded = expandedInRow.length === 1 ? expandedInRow[0] : undefined;
          const orderedRow = singleExpanded
            ? [singleExpanded, ...row.filter(({ key }) => key !== singleExpanded.key)]
            : expandedInRow.length > 1
              ? [...expandedInRow, ...row.filter(({ key }) => !expandedCards.has(key))]
              : row;
          const rowClassName = [
            "town-card-row",
            singleExpanded ? "has-single-expanded" : "",
            expandedInRow.length > 1 ? "has-multiple-expanded" : "",
            singleExpanded ? `is-expanded-${townColumnNames[singleExpanded.column]}` : "",
          ].filter(Boolean).join(" ");

          return (
            <div key={`town-row-${rowIndex}`} className={rowClassName}>
              {orderedRow.map(({ column, key, section, index }) => {
                const expanded = expandedCards.has(key);
                return (
                  <TownCard
                    key={key}
                    className={`town-card-column-${column}`}
                    expanded={expanded}
                    section={section}
                    index={index}
                    navigate={navigate}
                    onToggle={() => toggleCard(key)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CountySupportSections({ sections, navigate }: { sections: PageSection[]; navigate: (path: string) => void }) {
  return (
    <section className="section county-support-section">
      <div className="county-support-grid">
        {sections.map((section, index) => (
          <div key={section.id || index} className={`county-support-card ${index === 0 ? "county-support-primary" : ""}`}>
            <Blocks blocks={section.blocks} navigate={navigate} headingLevel="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}

const splitBlocksIntoCards = (blocks: ContentBlock[]) => {
  return blocks.reduce<ContentBlock[][]>((groups, block) => {
    const startsNewCard = ["H2", "H3"].includes(block.tag);
    if (startsNewCard || !groups.length) {
      groups.push([block]);
    } else {
      groups[groups.length - 1].push(block);
    }
    return groups;
  }, []);
};

function SplitCardSection({ className = "", section, navigate }: { className?: string; section: PageSection; navigate: (path: string) => void }) {
  return (
    <section className={`section split-card-section ${className}`}>
      <div className="split-card-grid">
        {splitBlocksIntoCards(section.blocks).map((blocks, index) => (
          <div key={`${section.id || "split"}-${index}`} className="split-card">
            <Blocks blocks={blocks} navigate={navigate} headingLevel="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}

function GuideInternalLink({ guide, navigate }: { guide: ComparisonGuide; navigate: (path: string) => void }) {
  return (
    <a
      href={guide.closingLink.href}
      className="button"
      onClick={(event) => {
        event.preventDefault();
        trackLinkClick(guide.closingLink.href, guide.closingLink.label, "comparison_guide");
        navigate(guide.closingLink.href);
      }}
    >
      {guide.closingLink.label}
    </a>
  );
}

export function ComparisonGuidePage({ page, navigate }: PageProps) {
  const guide = comparisonGuides[page.path];
  const actionSection = page.sections.find(isActionSection);

  if (!guide) return <StandardPage page={page} navigate={navigate} />;

  return (
    <div className="comparison-guide-page">
      <section className="section guide-hero-section">
        <div>
          <h1>{guide.title}</h1>
          <p>{guide.intro}</p>
        </div>
        <p>{guide.supportText}</p>
      </section>

      <section className="section guide-accordion-section">
        <div className="guide-accordion">
          {guide.panels.map((panel) => (
            <details key={panel.id} className="guide-panel">
              <summary>
                <span className="guide-panel-title">{panel.title}</span>
                <span className="guide-panel-summary">{panel.summary}</span>
                <span className="guide-panel-icon" aria-hidden="true" />
              </summary>
              <div className="guide-panel-content">
                {panel.topics.map((topic) => (
                  <article key={topic.heading} className="guide-topic">
                    <h2>{topic.heading}</h2>
                    <div className="guide-topic-grid">
                      <div>
                        <h3>{panel.primaryLabel}</h3>
                        <p>{topic.primary}</p>
                      </div>
                      <div>
                        <h3>{panel.secondaryLabel}</h3>
                        <p>{topic.secondary}</p>
                      </div>
                    </div>
                    <p className="guide-topic-takeaway">
                      <strong>Takeaway:</strong> {topic.takeaway}
                    </p>
                  </article>
                ))}
                <p className="guide-bottom-line">{panel.bottomLine}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section guide-closing-section">
        <div>
          <h2>{guide.closingTitle}</h2>
          <p>{guide.closingText}</p>
          <GuideInternalLink guide={guide} navigate={navigate} />
        </div>
      </section>

      {actionSection && <ActionSection section={actionSection} navigate={navigate} />}
    </div>
  );
}

function ResourceInternalLink({ resource, navigate }: { resource: ResourcePage; navigate: (path: string) => void }) {
  const link = resource.closingLink;
  if (!link) return null;

  return (
    <a
      href={link.href}
      className="button"
      onClick={(event) => {
        trackLinkClick(link.href, link.label, "resource_page");
        if (link.href.startsWith("/")) {
          event.preventDefault();
          navigate(link.href);
        }
      }}
    >
      {link.label}
    </a>
  );
}

export function ResourceAccordionPage({ page, navigate }: PageProps) {
  const resource = resourcePages[page.path];
  const actionSection = page.sections.find(isActionSection);

  if (!resource) return <StandardPage page={page} navigate={navigate} />;

  return (
    <div className="comparison-guide-page resource-page">
      <section className="section guide-hero-section">
        <div>
          <h1>{resource.title}</h1>
          <p>{resource.intro}</p>
        </div>
        <p>{resource.supportText}</p>
      </section>

      <section className="section guide-accordion-section">
        <div className="guide-accordion">
          {resource.panels.map((panel) => (
            <details key={panel.id} id={panel.id} className="guide-panel resource-panel">
              <summary>
                <span className="guide-panel-title">{panel.title}</span>
                <span className="guide-panel-summary">{panel.summary}</span>
                <span className="guide-panel-icon" aria-hidden="true" />
              </summary>
              <div className="guide-panel-content resource-panel-content">
                <Blocks blocks={panel.blocks} navigate={navigate} headingLevel="compact" />
              </div>
            </details>
          ))}
        </div>
      </section>

      {(resource.closingTitle || resource.closingText || resource.closingLink) && (
        <section className="section guide-closing-section">
          <div>
            {resource.closingTitle && <h2>{resource.closingTitle}</h2>}
            {resource.closingText && <p>{resource.closingText}</p>}
            <ResourceInternalLink resource={resource} navigate={navigate} />
          </div>
        </section>
      )}

      {actionSection && <ActionSection section={actionSection} navigate={navigate} />}
    </div>
  );
}

export function AboutPage({ page, navigate }: PageProps) {
  const profileSection = page.sections[0];
  const actionSection = page.sections.find(isActionSection);
  const introBlocks = profileSection.blocks.slice(0, 4);
  const profileImage = profileSection.images[0];

  return (
    <div className="about-page">
      <section className="section about-hero-section">
        {profileImage && (
          <div className="about-portrait">
            <img src={profileImage.src} alt={profileImage.alt} />
          </div>
        )}
        <div className="about-hero-copy">
          <Blocks blocks={introBlocks} navigate={navigate} promoteFirstHeading />
          <a
            href="/contact"
            className="button"
            onClick={(event) => {
              event.preventDefault();
              trackLinkClick("/contact", "Start a Conversation", "about_page");
              navigate("/contact");
            }}
          >
            Start a Conversation
          </a>
        </div>
      </section>

      <section className="section about-details-section">
        <div className="about-detail-card">
          <Blocks
            blocks={[
              { tag: "H3", text: "Connect Online" },
              { tag: "P", text: "Instagram" },
              { tag: "P", text: "ArthurPisko.Realtor" },
              { tag: "P", text: "Facebook" },
              { tag: "P", text: "Google Business Page" },
              { tag: "P", text: "Realtor.com" },
              { tag: "P", text: "Zillow" },
            ]}
            navigate={navigate}
            headingLevel="compact"
          />
        </div>
        <div className="about-detail-card">
          <Blocks
            blocks={[
              { tag: "H3", text: "Contact" },
              { tag: "P", text: "Arthur Pisko Jr." },
              { tag: "P", text: "856-493-7501" },
              { tag: "P", text: "arthurpisko@gmail.com" },
              { tag: "P", text: "NJ Real Estate License #: 2187170" },
              { tag: "P", text: "The Plum Real Estate Group" },
            ]}
            navigate={navigate}
            headingLevel="compact"
          />
        </div>
      </section>

      <section className="section about-proof-section">
        <div className="about-proof-card">
          <Blocks
            blocks={[
              { tag: "H3", text: "Areas Served" },
              {
                tag: "P",
                text: "I represent clients across South Jersey, including Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
              },
            ]}
            navigate={navigate}
            headingLevel="compact"
          />
        </div>
        <div className="about-proof-card">
          <Blocks
            blocks={[
              { tag: "H3", text: "What You Can Expect" },
              {
                tag: "P",
                text: "Consistent communication, local market expertise, and a streamlined selling process from listing strategy through closing.",
              },
            ]}
            navigate={navigate}
            headingLevel="compact"
          />
        </div>
        <div className="about-proof-card">
          <Blocks
            blocks={[
              { tag: "H3", text: "Client Note" },
              {
                tag: "P",
                text: "\"Arthur was able to get us an offer before the open house was over. The entire process was smooth and stress-free.\" - Bruce & Nichole V.",
              },
            ]}
            navigate={navigate}
            headingLevel="compact"
          />
        </div>
      </section>

      {actionSection && <ActionSection section={actionSection} navigate={navigate} />}
    </div>
  );
}

export function HomePage({ page, navigate, theme = "dark" }: PageProps & { theme?: SiteTheme }) {
  const [hero, about, actions] = page.sections;
  const heroImage = theme === "light" ? LIGHT_MODE_HOME_HERO_IMAGE : hero.images[0];

  return (
    <>
      <section className="section hero-section">
        <div className="hero-copy">
          <Blocks blocks={hero.blocks} navigate={navigate} promoteFirstHeading />
        </div>
        {heroImage && <img className="hero-image" src={heroImage.src} alt={heroImage.alt} />}
      </section>

      <section className="section image-copy-section about-teaser">
        {about.images[0] && <img src={about.images[0].src} alt={about.images[0].alt} />}
        <Blocks blocks={about.blocks} navigate={navigate} />
      </section>

      {actions && <ActionSection section={actions} navigate={navigate} />}
    </>
  );
}

export function CountyPage({ page, navigate }: PageProps) {
  const renderedSections: ReactNode[] = [];
  let townSections: Array<{ section: PageSection; index: number }> = [];
  let supportSections: PageSection[] = [];

  const flushTownSections = () => {
    if (!townSections.length) return;
    renderedSections.push(
      <TownGrid key={`town-grid-${townSections[0].section.id || townSections[0].index}`} sections={townSections} navigate={navigate} />,
    );
    townSections = [];
  };
  const flushSupportSections = () => {
    if (!supportSections.length) return;
    renderedSections.push(<CountySupportSections key={`support-${supportSections[0].id}`} sections={supportSections} navigate={navigate} />);
    supportSections = [];
  };

  page.sections.forEach((section, index) => {
    if (isTownSection(section, index)) {
      flushSupportSections();
      townSections.push({ section, index });
      return;
    }

    flushTownSections();

    if (isActionSection(section)) {
      renderedSections.push(<ActionSection key={section.id || index} section={section} navigate={navigate} />);
      return;
    }

    if (!section.images.length) {
      supportSections.push(section);
      return;
    }

    flushSupportSections();

    renderedSections.push(
      <section key={section.id || index} className={`section county-section ${index === 0 ? "county-intro" : ""}`}>
        <div className="county-media">
          <img src={section.images[0].src} alt={section.images[0].alt} />
        </div>
        <Blocks blocks={section.blocks} navigate={navigate} headingLevel="compact" promoteFirstHeading={index === 0} />
      </section>,
    );
  });

  flushTownSections();
  flushSupportSections();

  return (
    <div className="county-page">
      {renderedSections}
    </div>
  );
}

export function StandardPage({ page, navigate }: PageProps) {
  return (
    <div className="standard-page">
      {page.sections.map((section, index) => {
        if (isActionSection(section)) {
          return <ActionSection key={section.id || index} section={section} navigate={navigate} />;
        }

        const hasImage = section.images.length > 0;
        return (
          <section key={section.id || index} className={`section ${hasImage ? "image-copy-section profile-section" : "text-section"}`}>
            {hasImage && <img src={section.images[0].src} alt={section.images[0].alt} />}
            <Blocks
              blocks={section.blocks}
              navigate={navigate}
              headingLevel={index === 0 ? "default" : "compact"}
              promoteFirstHeading={index === 0}
              demoteHeadings={index > 0}
            />
          </section>
        );
      })}
    </div>
  );
}

export function NewsletterPage({ navigate }: { navigate: (path: string) => void }) {
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const leadApiPath = import.meta.env.VITE_LEAD_API_PATH || "/api/leads";

  return (
    <div className="newsletter-page">
      <section className="section newsletter-section">
        <div className="newsletter-copy">
          <p className="section-eyebrow">South Jersey market updates</p>
          <h1>Newsletter</h1>
          <p>
            A weekly real estate email for South New Jersey homeowners, buyers, and locals who want to keep an eye on the market without digging through scattered reports.
          </p>
          <div className="newsletter-feature-list" aria-label="Newsletter topics">
            <span>📈 Local housing trends</span>
            <span>📍 County and town notes</span>
            <span>🏠 Buyer and seller tips</span>
            <span>🧭 New site guides</span>
          </div>
          <p className="newsletter-note">
            No spam. No daily blast. Just useful local notes focused on South Jersey once a week.
          </p>
        </div>

        <form
          className="contact-form newsletter-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const lead = Object.fromEntries(formData.entries());
            const interest = String(formData.get("interest") || "market updates");

            setSubmitState("submitting");
            setSubmitMessage("");

            try {
              const response = await fetch(leadApiPath, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  ...lead,
                  formType: "newsletter",
                  sourceUrl: window.location.href,
                  pagePath: window.location.pathname,
                }),
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Newsletter signup failed.");
              }

              trackEvent("generate_lead", {
                form_name: "newsletter",
                lead_type: interest,
              });
              form.reset();
              setSubmitState("success");
              setSubmitMessage("Thanks. You're on the newsletter list.");
            } catch (error) {
              setSubmitState("error");
              setSubmitMessage(error instanceof Error ? error.message : "Newsletter signup failed.");
            }
          }}
        >
          <label className="lead-honeypot">
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>

          <label>
            Name
            <input name="name" autoComplete="name" />
          </label>

          <label>
            Email <span>(required)</span>
            <input required name="email" type="email" autoComplete="email" />
          </label>

          <label>
            County of interest
            <select name="county" defaultValue="">
              <option value="">Anywhere in South Jersey</option>
              <option>Atlantic County</option>
              <option>Burlington County</option>
              <option>Camden County</option>
              <option>Cape May County</option>
              <option>Cumberland County</option>
              <option>Gloucester County</option>
              <option>Salem County</option>
            </select>
          </label>

          <label>
            Main interest
            <select name="interest" defaultValue="Market updates">
              <option>Market updates</option>
              <option>Buying in South Jersey</option>
              <option>Selling in South Jersey</option>
              <option>Local community guides</option>
            </select>
          </label>

          <button className="button" type="submit" disabled={submitState === "submitting"}>
            {submitState === "submitting" ? "Signing up..." : "Sign Up"}
          </button>
          {submitMessage && (
            <p className={`form-status ${submitState === "error" ? "form-status-error" : ""}`} role="status">
              {submitMessage}
            </p>
          )}
        </form>
      </section>

      <section className="section newsletter-followup-section">
        <div>
          <h2>Want something more specific?</h2>
          <p>
            If you want a custom home list, a home value estimate, or direct advice about a move, the contact page is still the best place to start.
          </p>
          <a
            href="/contact"
            className="button"
            onClick={(event) => {
              event.preventDefault();
              trackLinkClick("/contact", "Start the Conversation", "newsletter_page");
              navigate("/contact");
            }}
          >
            Start the Conversation
          </a>
        </div>
      </section>
    </div>
  );
}

export function ContactPage({ page, navigate }: PageProps) {
  const [intro, promos] = page.sections;
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const contactIntroBlocks = intro.blocks
    .filter((block) => !["LABEL", "BUTTON"].includes(block.tag) && !CONTACT_FORM_PLACEHOLDER_TEXT.has(block.text))
    .map((block) => (block.tag === "H2" ? { ...block, text: block.text.replace("📬 ", "") } : block));
  const leadApiPath = import.meta.env.VITE_LEAD_API_PATH || "/api/leads";

  return (
    <>
      <section className="section contact-section">
        <div className="contact-copy">
          <Blocks
            blocks={contactIntroBlocks}
            className="contact-copy-content"
            navigate={navigate}
            promoteFirstHeading
          />
        </div>
        <form
          className="contact-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const lead = Object.fromEntries(formData.entries());
            const interest = String(formData.get("interest") || "unknown");

            setSubmitState("submitting");
            setSubmitMessage("");

            try {
              const response = await fetch(leadApiPath, {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  ...lead,
                  sourceUrl: window.location.href,
                  pagePath: window.location.pathname,
                }),
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Lead delivery failed.");
              }

              trackEvent("generate_lead", {
                form_name: "contact",
                lead_type: interest,
              });
              form.reset();
              setSubmitState("success");
              setSubmitMessage("Thanks. Your message was sent successfully.");
            } catch (error) {
              setSubmitState("error");
              setSubmitMessage(error instanceof Error ? error.message : "Lead delivery failed.");
            }
          }}
        >
          <label className="lead-honeypot">
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>

          <fieldset className="name-grid">
            <legend>Name</legend>
            <label>
              First Name <span>(required)</span>
              <input required name="firstName" />
            </label>
            <label>
              Last Name <span>(required)</span>
              <input required name="lastName" />
            </label>
          </fieldset>

          <label>
            Email <span>(required)</span>
            <input required name="email" type="email" />
          </label>

          <label>
            Phone <span>(required)</span>
            <input required name="phone" type="tel" />
          </label>

          <label>
            What can I help with? <span>(required)</span>
            <select required name="interest" defaultValue="">
              <option value="" disabled>Choose a topic</option>
              <option>Sell a home</option>
              <option>Buy a home</option>
              <option>Buy and sell</option>
              <option>Partnership or advertising inquiry</option>
            </select>
          </label>

          <label>
            Message <span>(required)</span>
            <textarea required name="message" rows={5} />
          </label>

          <button className="button" type="submit" disabled={submitState === "submitting"}>
            {submitState === "submitting" ? "Sending..." : "Send Message"}
          </button>
          {submitMessage && (
            <p className={`form-status ${submitState === "error" ? "form-status-error" : ""}`} role="status">
              {submitMessage}
            </p>
          )}
        </form>
      </section>

      {promos && <SplitCardSection section={promos} navigate={navigate} className="contact-promo-section" />}
    </>
  );
}
