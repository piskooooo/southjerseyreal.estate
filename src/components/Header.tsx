import { useState } from "react";
import { trackLinkClick } from "../analytics";
import { connectNav, countyNav, socialLinks } from "../content/navigation";

type HeaderProps = {
  currentPath: string;
  navigate: (path: string) => void;
};

const isInternal = (href: string) => href.startsWith("/");

export function Header({ currentPath, navigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const linkClass = (path: string) => (currentPath === path ? "is-active" : "");

  return (
    <header className="site-header">
      <a
        href="/"
        className="brand"
        onClick={(event) => {
          event.preventDefault();
          trackLinkClick("/", "South Jersey Real Estate", "header_brand");
          go("/");
        }}
      >
        South Jersey Real Estate
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        <div className="nav-folder">
          <button type="button" className={countyNav.some((item) => item.path === currentPath) ? "is-active" : ""}>
            Counties
          </button>
          <div className="nav-menu">
            {countyNav.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={linkClass(item.path)}
                onClick={(event) => {
                  event.preventDefault();
                  trackLinkClick(item.path, item.label, "header_nav");
                  go(item.path);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="nav-folder">
          <button type="button" className={connectNav.some((item) => item.path === currentPath) ? "is-active" : ""}>
            Connect
          </button>
          <div className="nav-menu">
            {connectNav.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={linkClass(item.path)}
                onClick={(event) => {
                  event.preventDefault();
                  trackLinkClick(item.path, item.label, "header_nav");
                  go(item.path);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="header-actions">
        <div className="social-links" aria-label="Social links">
          {socialLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackLinkClick(item.href, item.label, "header_social")}
            >
              {item.shortLabel}
            </a>
          ))}
        </div>
        <a
          href="/contact"
          className="button button-small"
          onClick={(event) => {
            event.preventDefault();
            trackLinkClick("/contact", "Contact", "header_cta");
            go("/contact");
          }}
        >
          Contact
        </a>
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <div>
          <p>Counties</p>
          {countyNav.map((item) => (
            <a key={item.path} href={item.path} onClick={(event) => {
              event.preventDefault();
              trackLinkClick(item.path, item.label, "mobile_nav");
              go(item.path);
            }}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <p>Connect</p>
          {connectNav.map((item) => (
            <a key={item.path} href={item.path} onClick={(event) => {
              event.preventDefault();
              trackLinkClick(item.path, item.label, "mobile_nav");
              go(item.path);
            }}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="mobile-socials">
          {socialLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackLinkClick(item.href, item.label, "mobile_social")}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
