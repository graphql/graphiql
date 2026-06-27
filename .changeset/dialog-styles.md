---
'@graphiql/react': minor
---

Add shared header/body/footer styles to the `Dialog` compound component: `Dialog.Header` (title + close button with a divider), `Dialog.Body` (padded content region), and `Dialog.Footer` (right-aligned action row). The settings dialog now uses `Dialog.Header`, and consumers can build consistent dialogs without re-implementing the layout.
