import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { routeAuthCallbackToAdmin } from "./admin/authCallback";
import "./styles.css";

routeAuthCallbackToAdmin();

const isAdminPath = (window.location.pathname.replace(/\/+$/, "") || "/") === "/admin";
const AdminPage = lazy(() => import("./admin/AdminPage"));
const PublicApp = lazy(() => import("./App"));

if (isAdminPath) {
  document.documentElement.dataset.theme = "light";
  let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.appendChild(robots);
  }
  robots.content = "noindex, nofollow, noarchive";
  document.title = "Website Editor | South Jersey Real Estate";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminPath ? (
      <Suspense fallback={<main aria-busy="true" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Opening website editor…</main>}>
        <AdminPage />
      </Suspense>
    ) : (
      <>
        <a className="skip-link" href="#page">Skip to content</a>
        <Suspense fallback={<main id="page" aria-busy="true" />}>
          <PublicApp />
        </Suspense>
      </>
    )}
  </StrictMode>,
);
