import { useState } from "react";
import { trackLinkClick } from "../analytics";
import type { SitewideContent } from "../content/siteEditor";

type HeaderProps = {
  brandName: string;
  content: SitewideContent["header"];
  currentPath: string;
  navigate: (path: string) => void;
  onToggleTheme: () => void;
  theme: "dark" | "light";
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

function ThemeIcon({ theme }: { theme: "dark" | "light" }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2.8v2.5M12 18.7v2.5M4.1 4.1l1.8 1.8M18.1 18.1l1.8 1.8M2.8 12h2.5M18.7 12h2.5M4.1 19.9l1.8-1.8M18.1 5.9l1.8-1.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M19.2 15.1A7.5 7.5 0 0 1 9 4.8a7.7 7.7 0 1 0 10.2 10.3Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function Header({ brandName, content, currentPath, navigate, onToggleTheme, theme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { connectLinks, connectLabel, contactLabel, countyLinks, countiesLabel, socialLinks } = content;

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
          trackLinkClick("/", brandName, "header_brand");
          go("/");
        }}
      >
        {brandName}
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        <div className="nav-folder">
          <button type="button" aria-haspopup="true" className={countyLinks.some((item) => item.path === currentPath) ? "is-active" : ""}>
            {countiesLabel}
          </button>
          <div className="nav-menu">
            {countyLinks.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={linkClass(item.path)}
                onClick={(event) => {
                  trackLinkClick(item.path, item.label, "header_nav");
                  if (isInternal(item.path)) {
                    event.preventDefault();
                    go(item.path);
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="nav-folder">
          <button type="button" aria-haspopup="true" className={connectLinks.some((item) => item.path === currentPath) ? "is-active" : ""}>
            {connectLabel}
          </button>
          <div className="nav-menu">
            {connectLinks.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={linkClass(item.path)}
                onClick={(event) => {
                  trackLinkClick(item.path, item.label, "header_nav");
                  if (isInternal(item.path)) {
                    event.preventDefault();
                    go(item.path);
                  }
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={onToggleTheme}
        >
          <ThemeIcon theme={theme} />
        </button>
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
          {contactLabel}
        </a>
        <button
          type="button"
          className="menu-button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
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
          <p>{countiesLabel}</p>
          {countyLinks.map((item) => (
            <a key={item.path} href={item.path} onClick={(event) => {
              trackLinkClick(item.path, item.label, "mobile_nav");
              if (isInternal(item.path)) {
                event.preventDefault();
                go(item.path);
              }
            }}>
              {item.label}
            </a>
          ))}
        </div>
        <div>
          <p>{connectLabel}</p>
          {connectLinks.map((item) => (
            <a key={item.path} href={item.path} onClick={(event) => {
              trackLinkClick(item.path, item.label, "mobile_nav");
              if (isInternal(item.path)) {
                event.preventDefault();
                go(item.path);
              }
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
