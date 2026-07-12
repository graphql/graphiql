---
'@graphiql/react': patch
---

Tighten up a few token/consistency loose ends: `MethodPill` now sources its query/mutation/subscription colors from `--accent-green`/`--accent-yellow`/`--accent-purple` instead of hand-typed OKLCH values, so it re-themes correctly; the status bar's horizontal gap now matches the top bar's; and icon buttons in the toolbar, activity rail, and response header now share a common `--icon-button-size-sm/md/lg` scale instead of each hardcoding its own size.
