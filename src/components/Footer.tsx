import { footerNav } from "../content/navigation";
import { trackLinkClick } from "../analytics";

type FooterProps = {
  navigate: (path: string) => void;
};

export function Footer({ navigate }: FooterProps) {
  return (
    <footer className="site-footer">
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
    </footer>
  );
}
