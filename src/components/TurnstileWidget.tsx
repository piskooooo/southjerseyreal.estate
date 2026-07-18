import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "interaction-only";
      size: "flexible";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-api";
const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileApiPromise: Promise<TurnstileApi> | undefined;

function loadTurnstileApi(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileApiPromise) return turnstileApiPromise;

  const promise = new Promise<TurnstileApi>((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
    const script = existingScript || document.createElement("script");

    const handleLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile did not initialize."));
    };
    const handleError = () => reject(new Error("Turnstile could not be loaded."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = TURNSTILE_SCRIPT_ID;
      script.setAttribute("src", TURNSTILE_SCRIPT_URL);
      script.setAttribute("async", "");
      script.setAttribute("defer", "");
      document.head.appendChild(script);
    }
  }).catch((error) => {
    turnstileApiPromise = undefined;
    throw error;
  });

  turnstileApiPromise = promise;
  return promise;
}

export function TurnstileWidget({
  action,
  onTokenChange,
  resetSignal,
  siteKey,
}: {
  action: string;
  onTokenChange: (token: string) => void;
  resetSignal: number;
  siteKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "expired" | "error">("loading");

  useEffect(() => {
    let active = true;

    loadTurnstileApi()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "interaction-only",
          size: "flexible",
          callback: (token) => {
            if (!active) return;
            setLoadState("ready");
            onTokenChange(token);
          },
          "expired-callback": () => {
            if (!active) return;
            setLoadState("expired");
            onTokenChange("");
          },
          "timeout-callback": () => {
            if (!active) return;
            setLoadState("expired");
            onTokenChange("");
          },
          "error-callback": () => {
            if (!active) return;
            setLoadState("error");
            onTokenChange("");
          },
        });
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onTokenChange, siteKey]);

  useEffect(() => {
    if (!resetSignal || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    setLoadState("loading");
    onTokenChange("");
  }, [onTokenChange, resetSignal]);

  const stateMessage = loadState === "error"
    ? "Spam protection could not load. Refresh the page and try again."
    : loadState === "expired"
    ? "Spam protection expired. Please complete it again."
    : loadState === "loading"
    ? "Loading spam protection..."
    : "Spam protection complete.";

  return (
    <div className="turnstile-challenge">
      <div
        ref={containerRef}
        className="turnstile-widget"
        data-sitekey={siteKey}
        data-action={action}
        role="group"
        aria-label="Spam protection"
      />
      <p
        className={`turnstile-verification-status ${loadState === "error" || loadState === "expired" ? "is-error" : ""}`.trim()}
        role={loadState === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {stateMessage}
      </p>
    </div>
  );
}
