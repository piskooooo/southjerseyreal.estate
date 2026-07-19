import { trackLinkClick } from "../analytics";
import { compliance } from "../content/compliance";

type Navigate = (path: string) => void;

function InternalLink({ children, href, navigate }: { children: string; href: string; navigate: Navigate }) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        trackLinkClick(href, children, "compliance_disclosure");
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

export function BrokerageDisclosure({ placement }: { placement: "header" | "footer" }) {
  return (
    <section className={`brokerage-disclosure brokerage-disclosure-${placement}`} aria-label="Licensed brokerage disclosure">
      <div className="brokerage-disclosure-primary">
        <a
          className="brokerage-legal-name"
          href={compliance.brokerWebsite}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackLinkClick(compliance.brokerWebsite, compliance.brokerLegalName, `${placement}_brokerage_disclosure`)}
        >
          {compliance.brokerLegalName}
        </a>
        <span className="brokerage-descriptor">{compliance.brokerDescriptor}</span>
        <span>
          Licensed brokerage office:{" "}
          <a
            href={compliance.licensedOfficePhoneHref}
            onClick={() => trackLinkClick(compliance.licensedOfficePhoneHref, compliance.licensedOfficePhone, `${placement}_brokerage_disclosure`)}
          >
            {compliance.licensedOfficePhone}
          </a>
        </span>
      </div>
      <p className="agent-license-disclosure">
        {compliance.agentLicensedName}, {compliance.agentLicenseType}, NJ Real Estate License #{compliance.agentLicenseNumber}.
      </p>
    </section>
  );
}

function FooterCredentialMarks() {
  return (
    <div className="footer-credential-logos" aria-label="Professional and equal housing marks">
      <span className="footer-credential-logo">
        <img src="/assets/equal-housing-opportunity-logo.webp" alt="Equal Housing Opportunity" width="1963" height="2331" />
      </span>
      {compliance.realtorMembershipVerified && (
        <span className="footer-credential-logo">
          <img src="/assets/realtor-logo.png" alt="REALTOR® member logo" width="1963" height="2331" />
        </span>
      )}
    </div>
  );
}

export function FairHousingNotice({ navigate }: { navigate: Navigate }) {
  return (
    <section className="fair-housing-notice" aria-label="Fair housing notice">
      <FooterCredentialMarks />
      <p>
        <strong>Equal Housing Opportunity.</strong> Housing-related services are provided in accordance with federal,
        state, and local fair-housing law.{" "}
        <InternalLink href="/disclaimer" navigate={navigate}>Fair housing and website disclosures</InternalLink>
        .
      </p>
    </section>
  );
}

export function CommunityInformationDisclaimer({ navigate }: { navigate: Navigate }) {
  return (
    <aside className="section community-information-disclaimer" aria-label="Community information note">
      <p>
        Community details can change. Confirm anything important to your decision with the appropriate source.{" "}
        <InternalLink href="/disclaimer" navigate={navigate}>Website disclosures</InternalLink>
        .
      </p>
    </aside>
  );
}

export function ProviderChoiceDisclosure() {
  return (
    <aside className="provider-choice-disclosure" aria-label="Provider choice disclosure">
      <strong>Unpaid directory.</strong> The site operator and affiliated brokerage receive no fee or other compensation
      for a provider's inclusion or selection. You are free to choose any provider. Inclusion is not a guarantee or
      warranty; compare current credentials, services, fees, and terms directly.
    </aside>
  );
}

export function ContactConsent({ navigate }: { navigate: Navigate }) {
  return (
    <p className="form-disclosure form-consent">
      By submitting this form, you authorize {compliance.agentLicensedName} and {compliance.brokerLegalName} to
      contact you by phone or email about this inquiry. This is not consent to receive automated or prerecorded
      marketing calls or texts. Submitting this form does not subscribe you to newsletters.{" "}
      <InternalLink href="/privacy-policy" navigate={navigate}>Privacy Policy</InternalLink>
      {" | "}
      <InternalLink href="/terms-of-service" navigate={navigate}>Terms of Service</InternalLink>
    </p>
  );
}

export function NewsletterConsent({ navigate }: { navigate: Navigate }) {
  return (
    <span>
      By subscribing, you agree to receive real-estate and local-information emails from {compliance.agentLicensedName}
      {" and "}{compliance.brokerLegalName}. You may unsubscribe at any time.{" "}
      <InternalLink href="/privacy-policy" navigate={navigate}>Privacy Policy</InternalLink>
      {" | "}
      <InternalLink href="/terms-of-service" navigate={navigate}>Terms of Service</InternalLink>
    </span>
  );
}
