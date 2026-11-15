import { useId, useState } from "react";
import { gclMapEmbedUrl, gclMapViewerUrl } from "../content/gclGuide";

export function GclMap() {
  const [loaded, setLoaded] = useState(false);
  const descriptionId = useId();
  const frameId = useId();

  return (
    <div className="insight-map">
      <p id={descriptionId}>
        Loading the map connects to Google, which may receive your IP address and use cookies.
        Your analytics choice on this site stays separate. Read the{" "}
        <a href="https://policies.google.com/privacy" rel="noreferrer">Google Privacy Policy</a>.
      </p>
      <div className="insight-map-actions">
        <button type="button" className="button" aria-describedby={descriptionId}
          aria-expanded={loaded} aria-controls={frameId} onClick={() => setLoaded((value) => !value)}>
          {loaded ? "Unload interactive map" : "Load interactive map"}
        </button>
        <a href={gclMapViewerUrl} rel="noreferrer">Open in Google Maps</a>
      </div>
      <div id={frameId} className="insight-map-frame">
        {loaded ? (
          <iframe title="Map of proposed GCL station locations" src={gclMapEmbedUrl}
            referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          <p>Explore the proposed stops from Camden to Glassboro. Load the interactive map, or read the station list below.</p>
        )}
      </div>
      <p className="insight-map-fallback">If the map does not display, open it in Google Maps or use the station list below.</p>
    </div>
  );
}
