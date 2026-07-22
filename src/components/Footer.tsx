import { trackLinkClick } from "../analytics";
import type { SitewideContent } from "../content/siteEditor";
import { BrokerageDisclosure, FairHousingNotice } from "./Compliance";

type FooterProps = {
  content: SitewideContent["footer"];
  navigate: (path: string) => void;
  onManagePrivacy: () => void;
};

export function Footer({ content, navigate, onManagePrivacy }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-top">
          <h2>{content.brandName}</h2>
          <nav className="site-footer-links" aria-label="Footer navigation">
            {content.linkGroups.map((group) => (
              <div key={group.label}>
                <h3>{group.label}</h3>
                {group.links.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(event) => {
                      trackLinkClick(item.path, item.label, "footer_nav");
                      if (item.path.startsWith("/")) {
                        event.preventDefault();
                        navigate(item.path);
                      }
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="site-footer-compliance">
          <BrokerageDisclosure placement="footer" />
          <FairHousingNotice navigate={navigate} />
        </div>
        <div className="site-footer-meta">
          <p className="site-footer-support">
            <a
              href={content.supportHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackLinkClick(content.supportHref, content.supportLabel, "footer_support")}
            >
              {content.supportLabel}
            </a>
            <span>{content.supportNote}</span>
          </p>
          <p>{content.copyright}</p>
          <p className="site-footer-disclosure">
            <a
              href={content.creatorHref}
              onClick={() => trackLinkClick(content.creatorHref, content.creatorCredit, "footer_credit")}
            >
              {content.creatorCredit}
            </a>
          </p>
          <button type="button" className="footer-privacy-button" onClick={onManagePrivacy}>
            {content.cookieSettingsLabel}
          </button>
        </div>
      </div>
    </footer>
  );
}
