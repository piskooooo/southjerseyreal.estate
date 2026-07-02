import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <a className="skip-link" href="#page">Skip to content</a>
    <App />
  </StrictMode>,
);
