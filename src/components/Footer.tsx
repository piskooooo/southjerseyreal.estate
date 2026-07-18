import { trackLinkClick } from "../analytics";
import type { SitewideContent } from "../content/siteEditor";

type FooterProps = {
  content: SitewideContent["footer"];
  navigate: (path: string) => void;
  onManagePrivacy: () => void;
};

function FooterCredentialLogos() {
  return (
    <div className="footer-credential-logos">
      <div className="footer-credential-logo">
        <img src="/assets/equal-housing-opportunity-logo.webp" alt="Equal Housing Opportunity" width="1963" height="2331" />
      </div>
      <div className="footer-credential-logo">
        <img src="/assets/realtor-logo.png" alt="REALTOR® logo" width="1963" height="2331" />
      </div>
    </div>
  );
}

export function Footer({ content, navigate, onManagePrivacy }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <h2>{content.brandName}</h2>
          <p>{content.copyright}</p>
          <p className="site-footer-disclosure">
            {content.licenseDisclosure}
          </p>
          <p className="site-footer-disclosure">
            Call or text <a href={content.phoneHref} onClick={() => trackLinkClick(content.phoneHref, content.phoneLabel, "footer_disclosure")}>{content.phoneLabel}</a>.
          </p>
          <button type="button" className="footer-privacy-button" onClick={onManagePrivacy}>
            {content.cookieSettingsLabel}
          </button>
        </div>
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
        <FooterCredentialLogos />
      </div>
    </footer>
  );
}
