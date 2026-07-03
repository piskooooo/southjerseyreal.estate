import { footerLinkGroups } from "../content/navigation";
import { trackLinkClick } from "../analytics";

type FooterProps = {
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

export function Footer({ navigate, onManagePrivacy }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <h2>South Jersey Real Estate</h2>
          <p>© 2026 South Jersey Real Estate</p>
          <p className="site-footer-disclosure">
            Arthur Pisko Jr., NJ Real Estate License #2187170.
          </p>
          <p className="site-footer-disclosure">
            Call or text <a href="tel:8564937501" onClick={() => trackLinkClick("tel:8564937501", "856-493-7501", "footer_disclosure")}>856-493-7501</a>.
          </p>
          <button type="button" className="footer-privacy-button" onClick={onManagePrivacy}>
            Cookie Settings
          </button>
        </div>
        <nav className="site-footer-links" aria-label="Footer navigation">
          {footerLinkGroups.map((group) => (
            <div key={group.label}>
              <h3>{group.label}</h3>
              {group.links.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(event) => {
                    event.preventDefault();
                    trackLinkClick(item.path, item.label, "footer_nav");
                    navigate(item.path);
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
