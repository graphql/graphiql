/** A link from an editor tab to the collection item it was opened from or saved as. */
export type TabLink = { collectionId: string; itemId: string };

/**
 * Tab↔item links are browser-local: they key off GraphiQL's own tab ids, which
 * live in localStorage and are stable across reloads. They are deliberately
 * kept out of `CollectionsStorage` — a remote/DB collections backend shared
 * between machines must not receive another client's tab ids.
 */
const LINKS_KEY = 'graphiql:collections:tab-links';

function isTabLink(value: unknown): value is TabLink {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TabLink).collectionId === 'string' &&
    typeof (value as TabLink).itemId === 'string'
  );
}

export function loadTabLinks(): Record<string, TabLink> {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const links: Record<string, TabLink> = {};
    for (const [tabId, link] of Object.entries(parsed)) {
      if (isTabLink(link)) {
        links[tabId] = link;
      }
    }
    return links;
  } catch {
    return {};
  }
}

export function saveTabLinks(links: Record<string, TabLink>): void {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  } catch {
    // Storage quota exceeded or unavailable — silent no-op.
  }
}
