import type { ContentBlock } from "../content/types";
import { trackLinkClick } from "../analytics";
import { compliance } from "../content/compliance";

type BlocksProps = {
  blocks: ContentBlock[];
  className?: string;
  navigate?: (path: string) => void;
  headingLevel?: "default" | "compact";
  promoteFirstHeading?: boolean;
  demoteHeadings?: boolean;
};

const ctaMap: Record<string, string> = {
  "Get Your Free Home Value Estimate": "/contact",
  "Get Your Custom Home List": "/contact",
  "Start the Conversation": "/contact",
  "Contact": "/contact",
  "Learn More": "/about",
};

const cleanHref = (href?: string) => href || "";

const fieldLabels = new Set([
  "Population",
  "Government",
  "Services",
  "Schools",
  "Parks & Recreation",
  "Shopping & Dining",
  "Transportation",
  "Local Highlights",
]);

const localTextLinks = [
  { label: "Atlantic County", href: "/atlantic-county" },
  { label: "Burlington County", href: "/burlington-county" },
  { label: "Camden County", href: "/camden-county" },
  { label: "Cape May County", href: "/cape-may-county" },
  { label: "Cumberland County", href: "/cumberland-county" },
  { label: "Gloucester County", href: "/gloucester-county" },
  { label: "Salem County", href: "/salem-county" },
  { label: "Why South Jersey guide", href: "/why-south-jersey" },
  { label: "Why New Jersey vs. Pennsylvania comparison", href: "/why-new-jersey" },
  { label: "Why New Jersey vs. Pennsylvania guide", href: "/why-new-jersey" },
  { label: "Why New Jersey vs. Pennsylvania", href: "/why-new-jersey" },
  { label: "Why New Jersey vs. Delaware comparison", href: "/why-new-jersey" },
  { label: "Why New Jersey vs. Delaware guide", href: "/why-new-jersey" },
  { label: "Why New Jersey vs. Delaware", href: "/why-new-jersey" },
  { label: "Partners Page", href: "/partners" },
  { label: "Partnerships page", href: "/partners" },
  { label: "Advertising Opportunities", href: "/advertise" },
  { label: "Advertising page", href: "/advertise" },
  { label: compliance.brokerLegalName, href: compliance.brokerWebsite },
  { label: "The Plum Real Estate Group", href: compliance.brokerWebsite },
  { label: "Google Business Page", href: "https://g.co/kgs/xMPHGmV" },
  { label: "Instagram", href: "https://www.instagram.com/arthurpisko/" },
  { label: "Facebook", href: "https://www.facebook.com/arthurpiskoREA/" },
  { label: "Zillow", href: "https://www.zillow.com/profile/arthurpisko" },
];

const phone = compliance.agentPhone;
const email = compliance.agentEmail;
const countyNames = ["Atlantic", "Burlington", "Camden", "Cape May", "Cumberland", "Gloucester", "Salem"];
const countyPathByName = new Map(countyNames.map((name) => [name, `/${name.toLowerCase().replace(/\s+/g, "-")}-county`]));
const countySeriesLinks = [
  {
    label: "Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties",
    names: countyNames,
  },
  {
    label: "Gloucester, Camden, and Burlington Counties",
    names: ["Gloucester", "Camden", "Burlington"],
  },
];

const linkTargets = [
  { label: phone, href: `tel:${phone}` },
  { label: compliance.licensedOfficePhone, href: compliance.licensedOfficePhoneHref },
  { label: email, href: `mailto:${email}` },
  ...localTextLinks,
].sort((a, b) => b.label.length - a.label.length);

const linkTargetMap = new Map(linkTargets.map((target) => [target.label.toLowerCase(), target.href]));
const escapedLinkPattern = linkTargets.map((target) => target.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const linkPattern = new RegExp(`(${escapedLinkPattern})`, "gi");
const escapedCountySeriesPattern = countySeriesLinks.map((target) => target.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const countySeriesPattern = new RegExp(`(${escapedCountySeriesPattern})`, "gi");
const autoLinkPattern =
  /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|(?:https?:\/\/|www\.)[^\s),]+|(?:[A-Z0-9-]+\.)+[A-Z]{2,})(?=[\s),.]|$)/gi;
const phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/;

const renderTextLink = (href: string, children: string, key: string, navigate?: (path: string) => void) => {
  const isLocal = href.startsWith("/");
  const isExternalPage = href.startsWith("http://") || href.startsWith("https://");

  return (
    <a
      key={key}
      href={href}
      target={isExternalPage ? "_blank" : undefined}
      rel={isExternalPage ? "noreferrer" : undefined}
      onClick={(event) => {
        trackLinkClick(href, children, "content");
        if (isLocal && navigate) {
          event.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
};

const renderCountySeries = (matchedText: string, key: string, navigate?: (path: string) => void) => {
  const series = countySeriesLinks.find((item) => item.label.toLowerCase() === matchedText.toLowerCase());
  if (!series) return matchedText;

  const finalWord = matchedText.endsWith("counties") ? "counties" : "Counties";

  return (
    <span key={key}>
      {series.names.map((name, index) => {
        const path = countyPathByName.get(name) || "/";
        const separator = index === 0 ? "" : index === series.names.length - 1 ? ", and " : ", ";

        return (
          <span key={`${key}-${name}`}>
            {separator}
            {renderTextLink(path, name, `${key}-${name}-link`, navigate)}
          </span>
        );
      })}{" "}
      {finalWord}
    </span>
  );
};

const linkifyKnownTargets = (text: string, navigate?: (path: string) => void, keyPrefix = "link") => {
  const parts = text.split(linkPattern);

  if (parts.length === 1) return linkifyAutoTargets(text, navigate, keyPrefix);

  return parts.map((part, index) => {
    const href = linkTargetMap.get(part.toLowerCase());
    if (!href) return linkifyAutoTargets(part, navigate, `${keyPrefix}-${index}`);
    return renderTextLink(href, part, `${keyPrefix}-${part}-${index}`, navigate);
  });
};

const linkifyAutoTargets = (text: string, navigate?: (path: string) => void, keyPrefix = "auto") => {
  const parts = text.split(autoLinkPattern);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (!part) return part;

    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(part)) {
      return renderTextLink(`mailto:${part}`, part, `${keyPrefix}-email-${index}`, navigate);
    }

    if (phonePattern.test(part)) {
      return renderTextLink(`tel:${part.replace(/[^\d+]/g, "")}`, part, `${keyPrefix}-phone-${index}`, navigate);
    }

    if (/^(?:https?:\/\/|www\.|(?:[A-Z0-9-]+\.)+[A-Z]{2,})/i.test(part)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return renderTextLink(href, part, `${keyPrefix}-url-${index}`, navigate);
    }

    return part;
  });
};

const linkifyInlineText = (text: string, navigate?: (path: string) => void) => {
  const parts = text.split(countySeriesPattern);

  if (parts.length === 1) return linkifyKnownTargets(text, navigate);

  return parts.map((part, index) => {
    const hasCountySeries = countySeriesLinks.some((item) => item.label.toLowerCase() === part.toLowerCase());
    if (hasCountySeries) return renderCountySeries(part, `county-series-${index}`, navigate);
    return linkifyKnownTargets(part, navigate, `inline-${index}`);
  });
};

const renderParagraphText = (text: string, navigate?: (path: string) => void) => {
  if (/home value estimate/i.test(text) && /custom home list/i.test(text)) {
    return renderTextLink("/contact", text, "contact-prompt", navigate);
  }

  const fieldMatch = text.match(/^([^:]+):\s*(.*)$/);

  if (fieldMatch && fieldLabels.has(fieldMatch[1])) {
    return (
      <>
        <strong className="field-label">{fieldMatch[1]}:</strong>{" "}
        {linkifyInlineText(fieldMatch[2], navigate)}
      </>
    );
  }

  return linkifyInlineText(text, navigate);
};

export function Blocks({
  blocks,
  className,
  navigate,
  headingLevel = "default",
  promoteFirstHeading = false,
  demoteHeadings = false,
}: BlocksProps) {
  const hasPageHeading = blocks.some((block) => block.tag === "H1");
  const firstHeadingIndex =
    promoteFirstHeading && !hasPageHeading ? blocks.findIndex((block) => ["H2", "H3"].includes(block.tag)) : -1;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        const key = `${block.tag}-${index}-${block.text.slice(0, 24)}`;
        const href = cleanHref(block.href) || ctaMap[block.text] || "";

        if (block.tag === "H1") {
          if (demoteHeadings) {
            return <h2 key={key} className={headingLevel === "compact" ? "compact-heading" : undefined}>{block.text}</h2>;
          }
          return <h1 key={key}>{block.text}</h1>;
        }

        if (block.tag === "H2") {
          if (index === firstHeadingIndex) {
            return <h1 key={key} className={headingLevel === "compact" ? "compact-heading" : undefined}>{block.text}</h1>;
          }
          return headingLevel === "compact" ? <h2 key={key} className="compact-heading">{block.text}</h2> : <h2 key={key}>{block.text}</h2>;
        }

        if (block.tag === "H3") {
          if (index === firstHeadingIndex) {
            return <h1 key={key} className={headingLevel === "compact" ? "compact-heading" : undefined}>{block.text}</h1>;
          }
          return <h3 key={key}>{block.text}</h3>;
        }

        if (block.tag === "H4") {
          return <h4 key={key}>{block.text}</h4>;
        }

        if (block.tag === "A" || ctaMap[block.text]) {
          const isLocal = href.startsWith("/");
          return (
            <a
              key={key}
              href={href || "#"}
              className="button"
              onClick={(event) => {
                trackLinkClick(href || "#", block.text, "content_button");
                if (isLocal) {
                  event.preventDefault();
                  navigate?.(href);
                }
              }}
            >
              {block.text}
            </a>
          );
        }

        if (block.tag === "BUTTON") {
          return <button key={key} type="submit" className="button">{block.text}</button>;
        }

        return <p key={key}>{renderParagraphText(block.text, navigate)}</p>;
      })}
    </div>
  );
}
