---
'@graphiql/react': minor
'graphiql': minor
---

Render Radix portals (dialogs, tooltips, dropdown menus) inside the GraphiQL container instead of `document.body`, via a new `PortalProvider`. Portaled content now inherits the container's `data-theme` / `data-density` / `data-font-size` tokens through normal CSS inheritance, so dialogs, tooltips, and menus respect the user's appearance settings. The legacy per-portal variable re-injection in `root.css` is removed in favor of inheritance.

Add shared header/body/footer styles to the `Dialog` compound component: `Dialog.Header` (title + close button with a divider), `Dialog.Body` (padded content region), and `Dialog.Footer` (right-aligned action row). Header, body, and footer padding scale with the density setting via new `--dialog-*` tokens, the header is tightened (smaller close-button hit area, optical alignment), and the settings dialog now uses `Dialog.Header`. Consumers can build consistent dialogs without re-implementing the layout.
