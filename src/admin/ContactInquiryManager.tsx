import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  Inbox,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  loadContactInquiries,
  type ContactInquiry,
} from "./contactInquiryStore";

const PAGE_SIZE = 50;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function safeSourcePath(value: string) {
  if (!value.startsWith("/")) return "";
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : "";
  } catch {
    return "";
  }
}

function statusLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "Pending";
  return normalized
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function InquiryCard({ inquiry }: { inquiry: ContactInquiry }) {
  const sourcePath = safeSourcePath(inquiry.sourcePath);
  const status = inquiry.notificationStatus.toLowerCase();
  return (
    <article className="admin-inquiry-card">
      <header className="admin-inquiry-card-head">
        <div>
          <p className="admin-inquiry-date"><CalendarClock size={14} /> {formatDate(inquiry.createdAt)}</p>
          <h3>{inquiry.name || "Name not provided"}</h3>
          {inquiry.interest ? <p className="admin-inquiry-interest">{inquiry.interest}</p> : null}
        </div>
        <span className={`admin-inquiry-status status-${status === "sent" ? "sent" : status === "failed" ? "failed" : "pending"}`}>
          Notification {statusLabel(inquiry.notificationStatus)}
        </span>
      </header>

      <div className="admin-inquiry-contact">
        {inquiry.email ? (
          <a href={`mailto:${inquiry.email}`}><Mail size={15} /> {inquiry.email}</a>
        ) : <span><Mail size={15} /> No email supplied</span>}
        {inquiry.phone ? (
          <a href={`tel:${inquiry.phone.replace(/[^+\d]/g, "")}`}><Phone size={15} /> {inquiry.phone}</a>
        ) : <span><Phone size={15} /> No phone supplied</span>}
        {sourcePath ? (
          <a href={sourcePath} target="_blank" rel="noreferrer"><MapPin size={15} /> {sourcePath} <ExternalLink size={13} /></a>
        ) : null}
      </div>

      <div className="admin-inquiry-message">
        <p><MessageSquareText size={16} /> Message</p>
        <div>{inquiry.message || "No message was included."}</div>
      </div>

      {inquiry.expiresAt ? (
        <p className="admin-inquiry-retention">Scheduled for automatic deletion after {formatDate(inquiry.expiresAt)}.</p>
      ) : null}
    </article>
  );
}

export function ContactInquiryManager({ active = true }: { active?: boolean }) {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const oldestCursor = useMemo(
    () => inquiries.length
      ? {
          createdAt: inquiries[inquiries.length - 1].createdAt,
          id: inquiries[inquiries.length - 1].id,
        }
      : null,
    [inquiries],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await loadContactInquiries({ limit: PAGE_SIZE });
      setInquiries(next);
      setHasMore(next.length === PAGE_SIZE);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The private inbox could not be loaded.");
    } finally {
      setLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !loaded && !loading) void refresh();
  }, [active, loaded, loading, refresh]);

  const loadMore = async () => {
    if (!oldestCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const next = await loadContactInquiries({
        limit: PAGE_SIZE,
        before: oldestCursor,
      });
      setInquiries((current) => {
        const known = new Set(current.map((inquiry) => inquiry.id));
        return [...current, ...next.filter((inquiry) => !known.has(inquiry.id))];
      });
      setHasMore(next.length === PAGE_SIZE);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Older inquiries could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="admin-inquiries" aria-labelledby="contact-inquiries-heading">
      <div className="admin-panel-heading">
        <div>
          <p>Private contact inbox</p>
          <h2 id="contact-inquiries-heading">Contact inquiries</h2>
        </div>
        <button type="button" className="admin-secondary-button" onClick={() => void refresh()} disabled={loading}>
          {loading ? <LoaderCircle className="admin-spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>
      <p className="admin-panel-intro">
        These messages are available only to an authorized website administrator and follow the site’s automatic retention policy.
      </p>

      {error ? (
        <div className="admin-inline-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()}>Try again</button>
        </div>
      ) : null}

      {loading && !loaded ? (
        <div className="admin-inbox-state"><LoaderCircle className="admin-spin" /><p>Loading private inquiries…</p></div>
      ) : null}

      {!loading && loaded && !inquiries.length ? (
        <div className="admin-inbox-state"><Inbox /><h3>No inquiries yet</h3><p>New contact-form submissions will appear here.</p></div>
      ) : null}

      {inquiries.length ? (
        <div className="admin-inquiry-list">
          {inquiries.map((inquiry) => <InquiryCard inquiry={inquiry} key={inquiry.id} />)}
        </div>
      ) : null}

      {hasMore ? (
        <button type="button" className="admin-load-more" onClick={() => void loadMore()} disabled={loadingMore}>
          {loadingMore ? <LoaderCircle className="admin-spin" size={16} /> : null}
          {loadingMore ? "Loading…" : "Load older inquiries"}
        </button>
      ) : null}
    </section>
  );
}
