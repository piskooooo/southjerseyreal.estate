import { footerNav } from "../content/navigation";
import { trackLinkClick } from "../analytics";

type FooterProps = {
  navigate: (path: string) => void;
};

function FooterCredentialLogos() {
  return (
    <div className="footer-credential-logos">
      <div className="footer-credential-logo">
        <img src="/assets/equal-housing-opportunity-logo.webp" alt="Equal Housing Opportunity" width="1130" height="1209" />
      </div>
      <div className="footer-credential-logo">
        <img src="/assets/realtor-logo.png" alt="REALTOR logo" width="1963" height="2331" />
      </div>
    </div>
  );
}

export function Footer({ navigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div>
          <h2>South Jersey Real Estate</h2>
          <p>
            © 2025 South Jersey Real Estate | All rights reserved |{" "}
            {footerNav.map((item) => (
              <span key={item.path}>
                <a
                  href={item.path}
                  onClick={(event) => {
                    event.preventDefault();
                    trackLinkClick(item.path, item.label, "footer_nav");
                    navigate(item.path);
                  }}
                >
                  {item.label}
                </a>{" "}
                |
              </span>
            ))}
          </p>
        </div>
        <FooterCredentialLogos />
      </div>
    </footer>
  );
}
