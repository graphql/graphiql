---
'@graphiql/react': patch
---

Export `ExecuteButton` from `@graphiql/react` again, so a custom toolbar can compose the run control without taking the whole `TopBar`. The top bar now renders this same component rather than its own copy, so there is one run button in the codebase. The button also stops a request again while one is in flight, matching v5: it becomes a Stop button while fetching or while a subscription is active, and stays enabled in that state even when a fresh run would be blocked.

The control's CSS classes moved from `graphiql-top-bar-run*` to `graphiql-execute-button*` now that it is no longer top bar specific.
