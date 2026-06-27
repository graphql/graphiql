# Block mutations when GET is selected

**Date:** 2026-06-27
**Branch:** `trevor/top-bar-method-switcher` (additional commits on PR #4360)
**Refs:** graphql/graphiql#4360, graphql/graphiql#4219

## Problem

PR #4360 adds a GET/POST method toggle to the top bar. The toggle sets
`transportMethod`, a stored *preference*. When the user runs a **mutation**
while GET is selected, the transport silently sends a POST anyway, because the
GraphQL-over-HTTP spec forbids mutations over GET.

That fallback is spec-correct, but invisible: the UI says "GET" while the wire
request is a POST. The displayed method lies, and the user gets no signal that
their selected method didn't apply.

## Goal

When GET is selected and the operation that would run is a mutation:

1. **Prevent the run** (no silent POST fallback triggered from the UI).
2. **Make the reason obvious**: a disabled Run control with an explanatory
   tooltip, plus a visual highlight on the method toggle (whose click switches
   to POST — the resolution).

Queries over GET remain allowed (spec-legal). Subscriptions are out of scope
(they use a different transport path). `fetcher`-only setups have no method
toggle and default to POST, so they are never affected.

## Core rule

A request is **blocked** when:

```
effectiveMethod === 'GET' && activeOperation?.operation === 'mutation'
```

where `effectiveMethod = transportMethod ?? 'POST'`.

### Active-operation resolution

- exactly one operation → that operation
- multiple operations → the one whose name matches `operationName`
- cannot resolve (multiple operations, no matching `operationName`) → treated as
  **not blocked**; the existing run-at-cursor / `ExecuteButton` operation picker
  governs which operation runs. Per-item blocking in the picker (below) covers
  the mutation entries directly.

## Architecture (Approach A — derive in context)

The block state is derived **once in the GraphiQL context** and consumed by all
run affordances, so the top-bar Run button and `ExecuteButton` never drift.

### 1. Pure helpers (new module in `@graphiql/react`)

```ts
// reason string when blocked, else null
function getRunBlockReason(
  method: HttpMethod | null,
  operation: OperationDefinitionNode | undefined,
): string | null;

function resolveActiveOperation(
  operations: OperationDefinitionNode[] | undefined,
  operationName: string | null | undefined,
): OperationDefinitionNode | undefined;
```

`getRunBlockReason` returns the mutation-over-GET reason
(`"Mutations can't be sent over GET — switch to POST."`) when
`(method ?? 'POST') === 'GET'` and `operation?.operation === 'mutation'`,
otherwise `null`. Granular by design: the single-active-operation path and the
per-dropdown-item path both call it.

These helpers are unit-tested directly.

### 2. Context selector

Expose the derived value via a selector (idiomatic zustand — computed at read
time, no synced/stale state field):

```ts
const runDisabledReason = useGraphiQL(state =>
  getRunBlockReason(
    state.transportMethod,
    resolveActiveOperation(state.operations, state.operationName),
  ),
);
```

`null` ⇒ runnable; otherwise the string is both the disabled signal
(`reason !== null`) and the tooltip text. The field can absorb additional block
reasons in the future.

### 3. `run()` guard (`stores/execution.ts`)

`run()` already destructures from `get()`. Add `operations` and
`transportMethod`, compute the reason via the same helper, and **early-return
(silent no-op)** when blocked — before any fetch. This is the single enforcement
chokepoint: it covers the top-bar button, `ExecuteButton`, and all four Monaco
`runQuery` keybindings (operation/variables/headers/response editors) without
wrapping each one. Mirrors a disabled button: nothing happens, and the visible
disabled state + highlighted toggle explain why.

### 4. Top-bar Run (`components/top-bar/index.tsx`)

- Container computes `runDisabledReason` from the store, passes a boolean
  `mutationBlockedOverGet` (or the reason string) to the pure `TopBarView`.
- `TopBarView`:
  - Run button `disabled={isFetching || mutationBlockedOverGet}`.
  - When blocked, wrap Run in `Tooltip` with the reason text.
  - Method toggle button gets an attention class when blocked (colored
    emphasis / subtle pulse) — clicking it switches to POST.

### 5. `ExecuteButton` (`components/execute-button/index.tsx`)

- Single-operation / plain button path: `disabled` + tooltip from
  `runDisabledReason`.
- Multi-operation dropdown: each `DropdownMenu.Item` is one operation. Disable
  the item when `getRunBlockReason(transportMethod, operation)` is non-null
  (i.e. a mutation while GET is selected), so mutation entries can't be picked.

### 6. CSS

- `components/top-bar/index.css`: attention style for the highlighted toggle.

## Single-button toggle note

The toggle is a single flip-button (shows the active method; click switches to
the other), not a two-segment GET/POST control. "Highlight the POST option"
therefore maps to highlighting that button, whose action already switches to
POST. If a two-segment control is adopted later, the highlight would target the
POST segment specifically.

## Validation

- **Unit (vitest / RTL):**
  - Helper: GET+mutation → reason; GET+query → null; POST+mutation → null;
    single-op resolution; multi-op resolves by `operationName`; ambiguous →
    null.
  - `TopBarView`: blocked → Run disabled + toggle has attention class + tooltip
    present; not blocked → Run enabled, no attention class.
  - `ExecuteButton`: GET+mutation single op → button disabled; multi-op dropdown
    → mutation items disabled, query items enabled.
  - `run()`: no fetch dispatched when blocked.
- **Story:** add a "GET + mutation (blocked)" story to `top-bar.stories.tsx`.
- **Types:** `npx turbo run types:check --filter=@graphiql/react`.

## Out of scope

- Subscriptions over GET.
- Redesigning the toggle into a two-segment control.
- Changing the transport's own GET→POST fallback (the block is at the UI layer;
  the transport behavior is unchanged for non-UI callers).
