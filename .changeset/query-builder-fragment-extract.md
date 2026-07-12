---
'@graphiql/plugin-query-builder': minor
---

Rework query builder fragment support:

- Move fragment extraction from a hard-to-find footer button to an inline row action: expand a field, select the children you want, and extract them to a fragment right from that row.
- An extracted field stays editable — the spread shows as a `...FragmentName` reference among the field's children, and ticking more fields adds them to the base query alongside it.
- Edit a fragment's own tree by clicking its reference row (or its name in the Fragments list), or by moving the editor cursor into it: a focused editor rooted at the fragment's type opens, with "Back to query" to return. Fragment edits flow to the fragment definition and every field that spreads it. Fragment names stay editable in place.
