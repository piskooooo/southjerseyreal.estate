import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BadgeInfo,
  BookOpenText,
  Building2,
  CircleHelp,
  Compass,
  Contact,
  ExternalLink,
  FileText,
  Home,
  Inbox,
  KeyRound,
  Landmark,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Newspaper,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  SITEWIDE_CONTENT_KEY,
  type ManagedContentRecord,
} from "../content/siteEditor";
import {
  clearAuthCallbackUrl,
  getAuthCallbackErrorMessage,
  hasAuthCallback,
  isPasswordSetupCallback,
} from "./authCallback";
import { ContactInquiryManager } from "./ContactInquiryManager";
import { PageDocumentEditor } from "./PageDocumentEditor";
import { loadAdminSiteContent } from "./siteContentStore";
import {
  getAdminRedirectUrl,
  isAdminSupabaseConfigured,
  supabase,
} from "./supabase";
import "./admin.css";

type AdminNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  viewPath: string;
};

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const navigationGroups: AdminNavGroup[] = [
  {
    label: "Website",
    items: [
      { key: SITEWIDE_CONTENT_KEY, label: "Sitewide content", icon: LayoutTemplate, viewPath: "/" },
    ],
  },
  {
    label: "Pages",
    items: [
      { key: "/", label: "Home", icon: Home, viewPath: "/" },
      { key: "/counties", label: "Counties hub", icon: Map, viewPath: "/counties" },
      { key: "/connect", label: "Connect hub", icon: Compass, viewPath: "/connect" },
      { key: "/about", label: "About", icon: BadgeInfo, viewPath: "/about" },
      { key: "/contact", label: "Contact", icon: Contact, viewPath: "/contact" },
      { key: "/newsletter", label: "Newsletter", icon: Newspaper, viewPath: "/newsletter" },
      { key: "/partners", label: "Real estate providers", icon: Building2, viewPath: "/partners" },
      { key: "/advertise", label: "Advertise", icon: Megaphone, viewPath: "/advertise" },
      { key: "/why-new-jersey", label: "Why New Jersey", icon: Landmark, viewPath: "/why-new-jersey" },
      { key: "/why-south-jersey", label: "Why South Jersey", icon: Map, viewPath: "/why-south-jersey" },
    ],
  },
  {
    label: "Counties",
    items: [
      { key: "/atlantic-county", label: "Atlantic", icon: Map, viewPath: "/atlantic-county" },
      { key: "/burlington-county", label: "Burlington", icon: Map, viewPath: "/burlington-county" },
      { key: "/camden-county", label: "Camden", icon: Map, viewPath: "/camden-county" },
      { key: "/cape-may-county", label: "Cape May", icon: Map, viewPath: "/cape-may-county" },
      { key: "/cumberland-county", label: "Cumberland", icon: Map, viewPath: "/cumberland-county" },
      { key: "/gloucester-county", label: "Gloucester", icon: Map, viewPath: "/gloucester-county" },
      { key: "/salem-county", label: "Salem", icon: Map, viewPath: "/salem-county" },
    ],
  },
  {
    label: "Information",
    items: [
      { key: "/faq", label: "FAQ", icon: CircleHelp, viewPath: "/faq" },
      { key: "/privacy-policy", label: "Privacy", icon: ShieldCheck, viewPath: "/privacy-policy" },
      { key: "/disclaimer", label: "Disclaimer", icon: FileText, viewPath: "/disclaimer" },
      { key: "/terms-of-service", label: "Terms", icon: BookOpenText, viewPath: "/terms-of-service" },
    ],
  },
];

const navigationItems = navigationGroups.flatMap((group) => group.items);
const navigationKeys = new Set(navigationItems.map((item) => item.key));
const SESSION_SECTION_KEY = "sjre-admin-section";
const SESSION_CONTACT_MODE_KEY = "sjre-admin-contact-mode";

type AccessState = "checking" | "signed-out" | "unauthorized" | "authorized" | "error" | "config-error";
type ContactMode = "inquiries" | "content";

function readStoredSection() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_SECTION_KEY) || "";
    return navigationKeys.has(stored) ? stored : SITEWIDE_CONTENT_KEY;
  } catch {
    return SITEWIDE_CONTENT_KEY;
  }
}

function readStoredContactMode(): ContactMode {
  try {
    return window.sessionStorage.getItem(SESSION_CONTACT_MODE_KEY) === "content"
      ? "content"
      : "inquiries";
  } catch {
    return "inquiries";
  }
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="admin-gate-shell">
      <section className="admin-gate-card admin-gate-loading" aria-live="polite">
        <div className="admin-brand-mark" aria-hidden="true">SJ</div>
        <LoaderCircle className="admin-spin" size={28} />
        <h1>South Jersey site editor</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

function GateError({
  title,
  message,
  onRetry,
  onSignOut,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onSignOut?: () => void;
}) {
  return (
    <main className="admin-gate-shell">
      <section className="admin-gate-card">
        <div className="admin-brand-mark" aria-hidden="true">SJ</div>
        <p className="admin-eyebrow"><LockKeyhole size={15} /> Private website editor</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <div className="admin-gate-actions">
          <button type="button" className="admin-primary-button" onClick={onRetry}><RefreshCw size={16} /> Try again</button>
          {onSignOut ? <button type="button" className="admin-secondary-button" onClick={onSignOut}><LogOut size={16} /> Sign out</button> : null}
          <a href="/" className="admin-text-link">Return to website</a>
        </div>
      </section>
    </main>
  );
}

function SignInPanel({ callbackError }: { callbackError: string }) {
  const [mode, setMode] = useState<"password" | "magic" | "reset">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(callbackError);
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setMessage("Signed in. Verifying private editor access…");
        setSuccess(true);
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: getAdminRedirectUrl(),
            shouldCreateUser: false,
          },
        });
        if (error) throw error;
        setMessage("Check your inbox for the secure sign-in link.");
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getAdminRedirectUrl(),
        });
        if (error) throw error;
        setMessage("If that email belongs to the administrator account, a password-reset link is on its way.");
        setSuccess(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sign-in request could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (nextMode: typeof mode) => {
    setMode(nextMode);
    setMessage("");
    setSuccess(false);
    setPassword("");
  };

  return (
    <main className="admin-gate-shell">
      <section className="admin-gate-card admin-sign-in-card">
        <div className="admin-brand-mark" aria-hidden="true">SJ</div>
        <p className="admin-eyebrow"><LockKeyhole size={15} /> Private website editor</p>
        <h1>{mode === "reset" ? "Reset your password" : "Welcome back"}</h1>
        <p>{mode === "reset"
          ? "Enter the administrator email to receive a secure recovery link."
          : "Sign in with the authorized administrator account to edit the website."}</p>

        <div className="admin-auth-tabs" role="tablist" aria-label="Sign-in method">
          <button type="button" role="tab" aria-selected={mode === "password"} className={mode === "password" ? "is-active" : ""} onClick={() => changeMode("password")}>
            <KeyRound size={15} /> Password
          </button>
          <button type="button" role="tab" aria-selected={mode === "magic"} className={mode === "magic" ? "is-active" : ""} onClick={() => changeMode("magic")}>
            <Mail size={15} /> Email link
          </button>
        </div>

        <form className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-email">Email address
            <input id="admin-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          </label>
          {mode === "password" ? (
            <label htmlFor="admin-password">Password
              <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
            </label>
          ) : null}
          {message ? <p className={success ? "admin-form-success" : "admin-form-error"} role={success ? "status" : "alert"}>{message}</p> : null}
          <button type="submit" className="admin-primary-button" disabled={busy}>
            {busy ? <LoaderCircle className="admin-spin" size={16} /> : mode === "reset" ? <Send size={16} /> : <LockKeyhole size={16} />}
            {busy ? "Working…" : mode === "password" ? "Sign in" : mode === "magic" ? "Send secure link" : "Send reset link"}
          </button>
        </form>

        <button type="button" className="admin-auth-mode-link" onClick={() => changeMode(mode === "reset" ? "password" : "reset")}>
          {mode === "reset" ? "Back to sign in" : "Forgot your password?"}
        </button>
        <a href="/" className="admin-text-link">Return to website</a>
      </section>
    </main>
  );
}

function PasswordRecoveryPanel({
  onComplete,
  onSignOut,
}: {
  onComplete: () => void;
  onSignOut: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || busy) return;
    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      clearAuthCallbackUrl();
      onComplete();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The password could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-gate-shell">
      <section className="admin-gate-card admin-sign-in-card">
        <div className="admin-brand-mark" aria-hidden="true">SJ</div>
        <p className="admin-eyebrow"><KeyRound size={15} /> Account recovery</p>
        <h1>Choose a new password</h1>
        <p>Set a new password before opening the private website editor.</p>
        <form className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-new-password">New password
            <input id="admin-new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </label>
          <label htmlFor="admin-confirm-password">Confirm new password
            <input id="admin-confirm-password" type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} />
          </label>
          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
          <button type="submit" className="admin-primary-button" disabled={busy}>
            {busy ? <LoaderCircle className="admin-spin" size={16} /> : <KeyRound size={16} />}
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
        <button type="button" className="admin-auth-mode-link" onClick={onSignOut}>Cancel and sign out</button>
      </section>
    </main>
  );
}

function EditorShell({
  session,
  records,
  setRecords,
  onReload,
  onSignOut,
}: {
  session: Session;
  records: ManagedContentRecord[];
  setRecords: Dispatch<SetStateAction<ManagedContentRecord[]>>;
  onReload: () => void;
  onSignOut: () => void;
}) {
  const [sectionKey, setSectionKey] = useState(readStoredSection);
  const [contactMode, setContactMode] = useState<ContactMode>(readStoredContactMode);
  const [notice, setNotice] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);
  const selectedItem = navigationItems.find((item) => item.key === sectionKey) || navigationItems[0];
  const record = records.find((item) => item.pageKey === selectedItem.key);
  const showContactInbox = sectionKey === "/contact" && contactMode === "inquiries";

  const hasUnsavedChanges = () => records.some((item) => (
    JSON.stringify(item.draft) !== JSON.stringify(item.savedDraft)
  ));

  const reloadEditor = () => {
    if (hasUnsavedChanges() && !window.confirm("Reload saved website data and discard all unsaved edits?")) return;
    onReload();
  };

  const signOut = () => {
    if (hasUnsavedChanges() && !window.confirm("Sign out and discard all unsaved edits?")) return;
    onSignOut();
  };

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_SECTION_KEY, sectionKey);
    } catch {
      // Session persistence is a convenience; the editor still works without it.
    }
  }, [sectionKey]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SESSION_CONTACT_MODE_KEY, contactMode);
    } catch {
      // Session persistence is a convenience; the editor still works without it.
    }
  }, [contactMode]);

  return (
    <div className="admin-app">
      <a href="#admin-main" className="admin-skip-link">Skip to editor</a>
      <aside className="admin-rail">
        <div className="admin-rail-brand">
          <div className="admin-brand-mark" aria-hidden="true">SJ</div>
          <div><strong>South Jersey</strong><span>Website editor</span></div>
        </div>
        <nav className="admin-navigation" aria-label="Website editor sections">
          {navigationGroups.map((group) => (
            <section className="admin-nav-group" key={group.label}>
              <p>{group.label}</p>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === sectionKey;
                  return (
                    <button
                      type="button"
                      className={isActive ? "is-active" : ""}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setSectionKey(item.key)}
                      disabled={editorBusy}
                      key={item.key}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="admin-rail-footer">
          <p title={session.user.email || undefined}>{session.user.email || "Authorized administrator"}</p>
          <button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-workspace-header">
          <div>
            <p>Website editor</p>
            <h1>{selectedItem.label}</h1>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-icon-button" onClick={reloadEditor} disabled={editorBusy} title="Reload saved website data" aria-label="Reload saved website data"><RefreshCw size={17} /></button>
            <a className="admin-view-page" href={selectedItem.viewPath} target="_blank" rel="noreferrer">
              View {selectedItem.key === SITEWIDE_CONTENT_KEY ? "website" : "page"} <ExternalLink size={15} />
            </a>
          </div>
        </header>

        {sectionKey === "/contact" ? (
          <div className="admin-mode-switch" role="tablist" aria-label="Contact admin mode">
            <button type="button" role="tab" aria-selected={contactMode === "inquiries"} className={contactMode === "inquiries" ? "is-active" : ""} onClick={() => setContactMode("inquiries")} disabled={editorBusy}><Inbox size={16} /> Manage inquiries</button>
            <button type="button" role="tab" aria-selected={contactMode === "content"} className={contactMode === "content" ? "is-active" : ""} onClick={() => setContactMode("content")} disabled={editorBusy}><Settings2 size={16} /> Edit page copy</button>
          </div>
        ) : null}

        {notice ? <div className="admin-notice" role="status" aria-live="polite">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div> : null}

        <main className="admin-main" id="admin-main">
          {showContactInbox ? <ContactInquiryManager /> : record ? (
            <PageDocumentEditor
              record={record}
              onChange={setRecords}
              setNotice={setNotice}
              onBusyChange={setEditorBusy}
            />
          ) : (
            <div className="admin-inline-error" role="alert">
              <p>This editable page is missing from the loaded website data.</p>
              <button type="button" onClick={reloadEditor}>Reload editor data</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [accessState, setAccessState] = useState<AccessState>(
    isAdminSupabaseConfigured ? "checking" : "config-error",
  );
  const [session, setSession] = useState<Session | null>(null);
  const [accessError, setAccessError] = useState("");
  const [records, setRecords] = useState<ManagedContentRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(isPasswordSetupCallback);
  const accessRequestRef = useRef(0);
  const callbackError = getAuthCallbackErrorMessage();

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = existingRobots?.content;
    const robots = existingRobots || document.head.appendChild(document.createElement("meta"));
    robots.name = "robots";
    robots.content = "noindex, nofollow, noarchive";
    document.title = "Website Editor | South Jersey Real Estate";
    document.body.classList.add("is-admin-route");
    return () => {
      document.title = previousTitle;
      document.body.classList.remove("is-admin-route");
      if (!existingRobots) robots.remove();
      else existingRobots.content = previousRobots || "index, follow";
    };
  }, []);

  const verifyAccess = useCallback(async (nextSession: Session | null) => {
    const requestId = ++accessRequestRef.current;
    setSession(nextSession);
    setRecordsError("");
    if (!nextSession) {
      setRecords([]);
      setAccessState("signed-out");
      return;
    }
    if (!supabase) {
      setAccessState("config-error");
      return;
    }
    setAccessState("checking");
    setAccessError("");
    const { data, error } = await supabase.rpc("is_site_admin");
    if (requestId !== accessRequestRef.current) return;
    if (error) {
      setAccessError(`The administrator permission check failed: ${error.message}`);
      setAccessState("error");
      return;
    }
    if (data !== true) {
      setAccessState("unauthorized");
      return;
    }
    setAccessState("authorized");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setAccessError(`The saved sign-in session could not be checked: ${error.message}`);
        setAccessState("error");
        return;
      }
      void verifyAccess(data.session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      window.setTimeout(() => {
        if (mounted) void verifyAccess(nextSession);
      }, 0);
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [verifyAccess]);

  useEffect(() => {
    if (accessState === "authorized" && !recoveryMode && hasAuthCallback()) {
      clearAuthCallbackUrl();
    }
  }, [accessState, recoveryMode]);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError("");
    try {
      setRecords(await loadAdminSiteContent());
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : "The editable website data could not be loaded.");
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessState === "authorized" && !recoveryMode && !records.length && !recordsLoading && !recordsError) {
      void loadRecords();
    }
  }, [accessState, loadRecords, records.length, recordsError, recordsLoading, recoveryMode]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    clearAuthCallbackUrl();
    setRecords([]);
    setSession(null);
    setRecoveryMode(false);
    setAccessState("signed-out");
  };

  if (accessState === "config-error") {
    return (
      <GateError
        title="Editor connection unavailable"
        message="The browser-safe Supabase URL and publishable key are not configured for this deployment. No website data has been exposed."
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (accessState === "checking") return <LoadingScreen message="Checking your secure session and administrator access…" />;
  if (accessState === "signed-out") return <SignInPanel callbackError={callbackError} />;
  if (accessState === "unauthorized") {
    return (
      <GateError
        title="Administrator access required"
        message="This signed-in account is not assigned to the website administrator slot. The editor remains locked."
        onRetry={() => session ? void verifyAccess(session) : window.location.reload()}
        onSignOut={() => void signOut()}
      />
    );
  }
  if (accessState === "error") {
    return (
      <GateError
        title="Access check unavailable"
        message={accessError || "The editor could not verify administrator access. It has remained locked."}
        onRetry={() => session ? void verifyAccess(session) : window.location.reload()}
        onSignOut={session ? () => void signOut() : undefined}
      />
    );
  }
  if (recoveryMode) {
    return <PasswordRecoveryPanel onComplete={() => setRecoveryMode(false)} onSignOut={() => void signOut()} />;
  }
  if (recordsLoading || !session && accessState === "authorized") return <LoadingScreen message="Loading editable website content…" />;
  if (recordsError) {
    return (
      <GateError
        title="Website content unavailable"
        message={recordsError}
        onRetry={() => void loadRecords()}
        onSignOut={() => void signOut()}
      />
    );
  }
  if (!session || !records.length) return <LoadingScreen message="Loading editable website content…" />;

  return (
    <EditorShell
      session={session}
      records={records}
      setRecords={setRecords}
      onReload={() => void loadRecords()}
      onSignOut={() => void signOut()}
    />
  );
}
