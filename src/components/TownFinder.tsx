import { useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { findTownFinderEntries, type TownFinderEntry } from "../content/townFinder";
import { shouldHandleInternalNavigation } from "../internalNavigation";

const RESULT_LIMIT = 8;

export function TownFinder({
  entries,
  ready,
  navigate,
}: {
  entries: readonly TownFinderEntry[];
  ready: boolean;
  navigate: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const firstResult = useRef<HTMLAnchorElement>(null);
  const matches = ready ? findTownFinderEntries(entries, query) : [];
  const visibleMatches = matches.slice(0, RESULT_LIMIT);
  const hasQuery = Boolean(query.trim());
  const status = !ready
    ? "Loading towns…"
    : !hasQuery
      ? ""
      : matches.length === 0
        ? "No towns found. Try another name, or browse the counties below."
        : matches.length > RESULT_LIMIT
          ? `${matches.length} towns found. Showing the first ${RESULT_LIMIT}; keep typing to narrow the list.`
          : `${matches.length} ${matches.length === 1 ? "town" : "towns"} found.`;

  const clearSearch = () => {
    setQuery("");
    input.current?.focus();
  };

  return (
    <section className="section town-finder" aria-labelledby="town-finder-heading">
      <div className="town-finder-copy">
        <h2 id="town-finder-heading">Find a town</h2>
        <p id="town-finder-help">Search by name across all seven counties.</p>
      </div>
      <div className="town-finder-search" role="search" aria-label="Town directory">
        <div className="town-finder-field">
          <Search size={20} aria-hidden="true" />
          <input
            ref={input}
            type="search"
            aria-labelledby="town-finder-heading"
            aria-describedby="town-finder-help"
            aria-controls={visibleMatches.length ? "town-finder-results" : undefined}
            placeholder="Enter a town name"
            autoComplete="off"
            spellCheck={false}
            disabled={!ready}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                clearSearch();
              } else if ((event.key === "ArrowDown" || event.key === "Enter") && firstResult.current) {
                event.preventDefault();
                firstResult.current.focus();
              }
            }}
          />
          {query && <button type="button" onClick={clearSearch}>Clear</button>}
        </div>
        <p className="town-finder-status" role="status" aria-atomic="true">{status}</p>
        {visibleMatches.length > 0 && (
          <ul className="town-finder-results" id="town-finder-results" aria-label="Matching towns">
            {visibleMatches.map((entry, index) => (
              <li key={entry.key}>
                <a
                  ref={index === 0 ? firstResult : undefined}
                  href={entry.href}
                  onClick={(event) => {
                    if (!shouldHandleInternalNavigation(event)) return;
                    event.preventDefault();
                    navigate(entry.href);
                  }}
                >
                  <span><strong>{entry.name}</strong><span className="town-finder-county">{entry.county}</span></span>
                  <ArrowRight size={20} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
