import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { routeAuthCallbackToAdmin } from "./admin/authCallback";
import PublicApp from "./App";
import { preparePublicContent } from "./content/publicSiteContent";
import "./styles.css";

routeAuthCallbackToAdmin();

const isAdminPath = (window.location.pathname.replace(/\/+$/, "") || "/") === "/admin";
const AdminPage = lazy(() => import("./admin/AdminPage"));

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

function mountApp() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {isAdminPath ? (
        <Suspense fallback={<main aria-busy="true" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Opening website editor…</main>}>
          <AdminPage />
        </Suspense>
      ) : (
        <>
          <a className="skip-link" href="#page">Skip to content</a>
          <PublicApp />
        </>
      )}
    </StrictMode>,
  );
}

if (isAdminPath) mountApp();
else {
  // Leave the complete initial HTML in place while a cold county route loads.
  void preparePublicContent(window.location.pathname).then(mountApp).catch(() => {
    console.warn("Interactive page content could not be loaded. The initial page remains available; refresh to retry.");
  });
}
