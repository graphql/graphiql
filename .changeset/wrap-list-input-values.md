---
'graphql-language-service': patch
---

Wrap autocompleted list input values in square brackets

When you complete an enum or boolean value for a list-typed argument or input field (e.g. `[Episode]`), the suggestion now inserts `[JEDI]` instead of a bare `JEDI`, which produced an invalid query. Values completed inside an existing list literal, and non-list values, are left as they were.
