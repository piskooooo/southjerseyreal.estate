import { useState } from "react";
import { trackLinkClick } from "../analytics";
import { connectNav, countyNav, socialLinks } from "../content/navigation";

type HeaderProps = {
  currentPath: string;
  navigate: (path: string) => void;
};

const isInternal = (href: string) => href.startsWith("/");

function SocialIcon({ icon }: { icon: string }) {
  if (icon === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.2 8.4V6.7c0-.8.5-1 1-1h1.8V2.6c-.3 0-1.4-.1-2.7-.1-2.7 0-4.6 1.7-4.6 4.7v1.2H6.8v3.5h2.9v9.6h3.6v-9.6h3l.5-3.5h-3.1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="16" height="16" rx="4.5" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" />
    </svg>
  );
}

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
              <SocialIcon icon={item.icon} />
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
