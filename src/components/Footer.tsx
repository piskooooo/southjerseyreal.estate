import { footerNav } from "../content/navigation";
import { trackLinkClick } from "../analytics";

type FooterProps = {
  navigate: (path: string) => void;
};

function EqualHousingMark() {
  return (
    <div className="equal-housing-mark" aria-label="Equal Housing Opportunity">
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
        <path d="M8 30 32 10l24 20" />
        <path d="M14 28v27h36V28" />
        <path d="M22 36h20" />
        <path d="M22 45h20" />
      </svg>
      <span>Equal Housing Opportunity</span>
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
        <EqualHousingMark />
      </div>
    </footer>
  );
}
