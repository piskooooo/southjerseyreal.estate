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

export function FairHousingNotice() {
  return (
    <section className="fair-housing-notice" aria-label="Fair housing notice">
      <img src="/assets/equal-housing-opportunity-logo.webp" alt="Equal Housing Opportunity" width="1963" height="2331" />
      <p>
        <strong>Equal Housing Opportunity.</strong> {compliance.brokerLegalName} and its affiliated licensees provide
        housing-related services without discrimination based on any characteristic protected by federal, New Jersey,
        or applicable local law, including race, color, creed or religion, national origin, nationality, ancestry,
        pregnancy or breastfeeding, sex, gender identity or expression, affectional or sexual orientation, familial
        status, disability, liability for service in the Armed Forces of the United States, marital status, civil union
        status, domestic partnership status, or source of lawful income used for rental or mortgage payments.
      </p>
    </section>
  );
}

export function CommunityInformationDisclaimer() {
  return (
    <section className="section community-information-disclaimer" aria-labelledby="community-information-heading">
      <h2 id="community-information-heading">Verify community information</h2>
      <p>
        Community, market, tax, school, flood, insurance, transportation, public-safety, and amenity information can
        change and should be independently verified with the relevant public agency, school district, insurer,
        attorney, inspector, association, or other qualified professional before it is used in a real-estate decision.
      </p>
      <p>
        Policy sources reviewed:{" "}
        <a href="https://www.nj.gov/dobi/proposed/aa260120njac11_5.pdf" target="_blank" rel="noreferrer">
          New Jersey Real Estate Commission rules
        </a>
        {" and "}
        <a
          href="https://www.nj.gov/oag/dcr/downloads/DCR-Model-Fair-Housing-Policy-12.12.2019_Final.pdf"
          target="_blank"
          rel="noreferrer"
        >
          New Jersey Division on Civil Rights fair-housing policy
        </a>
        . Last reviewed: July 18, 2026.
      </p>
    </section>
  );
}

export function ProviderChoiceDisclosure() {
  return (
    <aside className="provider-choice-disclosure" aria-label="Provider choice disclosure">
      <strong>You are free to choose any provider.</strong> Directory inclusion is not a guarantee or warranty of a
      provider's work, fees, availability, licensing, insurance, or performance. Paid placements are labeled
      <strong> Sponsored</strong> and <strong>Paid advertisement</strong>.
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
