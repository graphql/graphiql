# Block mutations when GET is selected — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent running a mutation while the GET method is selected, and make the reason obvious in the UI, instead of silently falling back to POST.

**Architecture:** A pure helper computes a "run block reason" from the active HTTP method + the operation that would run. It is consumed in three places that share this one source of truth: the `run()` store action (silent early-return guard), the top-bar Run button (disabled + tooltip + highlighted method toggle), and `ExecuteButton` (disabled button + disabled mutation items in its multi-operation dropdown).

**Tech Stack:** TypeScript, React, Zustand, Vitest + Testing Library, graphql-js. Package: `@graphiql/react`. Base branch: `trevor/top-bar-method-switcher` (commits land on PR #4360).

---

## File Structure

- **Create** `packages/graphiql-react/src/utility/run-block.ts` — pure helpers `resolveActiveOperation`, `getRunBlockReason`, and the `MUTATION_OVER_GET_REASON` constant. One responsibility: decide whether a run is blocked and why.
- **Create** `packages/graphiql-react/src/utility/run-block.test.ts` — unit tests for the helpers.
- **Modify** `packages/graphiql-react/src/utility/index.ts` — re-export the helpers.
- **Modify** `packages/graphiql-react/src/stores/execution.ts` — `run()` reads `operations` + `transportMethod` and early-returns when blocked.
- **Modify** `packages/graphiql-react/src/components/top-bar/index.tsx` — container derives the reason; `TopBarView` gains a `runDisabledReason` prop, disables Run with a tooltip, and highlights the toggle.
- **Modify** `packages/graphiql-react/src/components/top-bar/index.css` — attention style for the highlighted toggle.
- **Modify** `packages/graphiql-react/src/components/top-bar/top-bar.test.tsx` — tests for the blocked state.
- **Modify** `packages/graphiql-react/src/components/top-bar/top-bar.stories.tsx` — a "GET + mutation (blocked)" story.
- **Modify** `packages/graphiql-react/src/components/execute-button/index.tsx` — disable the plain button when blocked; disable mutation items in the dropdown.
- **Create** `packages/graphiql-react/src/components/execute-button/execute-button.test.tsx` — tests for the connected button (mocked provider).

**Commands** (run from repo root):
- Single test file: `yarn workspace @graphiql/react vitest run <path>`
- Types: `yarn workspace @graphiql/react types:check`

---

## Task 1: Pure run-block helper

**Files:**
- Create: `packages/graphiql-react/src/utility/run-block.ts`
- Test: `packages/graphiql-react/src/utility/run-block.test.ts`
- Modify: `packages/graphiql-react/src/utility/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/graphiql-react/src/utility/run-block.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parse, OperationDefinitionNode } from 'graphql';
import {
  getRunBlockReason,
  resolveActiveOperation,
  MUTATION_OVER_GET_REASON,
} from './run-block';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const QUERY = opsOf('query Q { a }');
const MUTATION = opsOf('mutation M { a }');
const MIXED = opsOf('query Q { a }\nmutation M { b }');

describe('resolveActiveOperation', () => {
  it('returns undefined when there are no operations', () => {
    expect(resolveActiveOperation([], null)).toBeUndefined();
    expect(resolveActiveOperation(undefined, null)).toBeUndefined();
  });

  it('returns the sole operation regardless of operationName', () => {
    expect(resolveActiveOperation(QUERY, null)).toBe(QUERY[0]);
    expect(resolveActiveOperation(QUERY, 'nope')).toBe(QUERY[0]);
  });

  it('returns the operation matching operationName when there are several', () => {
    expect(resolveActiveOperation(MIXED, 'M')).toBe(MIXED[1]);
  });

  it('returns undefined when several operations and no match', () => {
    expect(resolveActiveOperation(MIXED, null)).toBeUndefined();
    expect(resolveActiveOperation(MIXED, 'unknown')).toBeUndefined();
  });
});

describe('getRunBlockReason', () => {
  it('blocks a mutation over GET', () => {
    expect(getRunBlockReason('GET', MUTATION[0])).toBe(
      MUTATION_OVER_GET_REASON,
    );
  });

  it('allows a query over GET', () => {
    expect(getRunBlockReason('GET', QUERY[0])).toBeNull();
  });

  it('allows a mutation over POST', () => {
    expect(getRunBlockReason('POST', MUTATION[0])).toBeNull();
  });

  it('treats a null/undefined method as POST (allowed)', () => {
    expect(getRunBlockReason(null, MUTATION[0])).toBeNull();
    expect(getRunBlockReason(undefined, MUTATION[0])).toBeNull();
  });

  it('does not block when the active operation is undefined', () => {
    expect(getRunBlockReason('GET', undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn workspace @graphiql/react vitest run src/utility/run-block.test.ts`
Expected: FAIL — cannot resolve `./run-block` / exports not defined.

- [ ] **Step 3: Write the helper**

Create `packages/graphiql-react/src/utility/run-block.ts`:

```ts
import type { HttpMethod } from '@graphiql/toolkit';
import { OperationDefinitionNode, OperationTypeNode } from 'graphql';

/**
 * Shown when the user tries to run a mutation while the GET method is selected.
 * Mutations are forbidden over GET by the GraphQL-over-HTTP spec.
 */
export const MUTATION_OVER_GET_REASON =
  "Mutations can't be sent over GET — switch to POST.";

/**
 * The operation that a run would execute: the sole operation when there is one,
 * otherwise the one whose name matches `operationName`. Returns `undefined` when
 * the choice is ambiguous (several operations, no matching name).
 */
export function resolveActiveOperation(
  operations: readonly OperationDefinitionNode[] | undefined,
  operationName: string | null | undefined,
): OperationDefinitionNode | undefined {
  if (!operations?.length) {
    return undefined;
  }
  if (operations.length === 1) {
    return operations[0];
  }
  return operations.find(op => op.name?.value === operationName);
}

/**
 * Returns a human-readable reason a run is blocked, or `null` when it may
 * proceed. Currently the only reason is a mutation over GET.
 */
export function getRunBlockReason(
  method: HttpMethod | null | undefined,
  operation: OperationDefinitionNode | undefined,
): string | null {
  const effectiveMethod = method ?? 'POST';
  if (
    effectiveMethod === 'GET' &&
    operation?.operation === OperationTypeNode.MUTATION
  ) {
    return MUTATION_OVER_GET_REASON;
  }
  return null;
}
```

- [ ] **Step 4: Re-export from the utility barrel**

In `packages/graphiql-react/src/utility/index.ts`, add after the `pick` export (line 11):

```ts
export {
  getRunBlockReason,
  resolveActiveOperation,
  MUTATION_OVER_GET_REASON,
} from './run-block';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn workspace @graphiql/react vitest run src/utility/run-block.test.ts`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add packages/graphiql-react/src/utility/run-block.ts \
        packages/graphiql-react/src/utility/run-block.test.ts \
        packages/graphiql-react/src/utility/index.ts
git commit -m "Add run-block helper for mutation-over-GET"
```

---

## Task 2: Guard `run()` in the execution store

**Files:**
- Modify: `packages/graphiql-react/src/stores/execution.ts`

This is the single enforcement chokepoint — it covers the top-bar button, `ExecuteButton`, and all four Monaco `runQuery` keybindings.

- [ ] **Step 1: Import the helpers**

At the top of `packages/graphiql-react/src/stores/execution.ts`, the existing import from `'../utility'` is:

```ts
import { tryParseJSONC, Range } from '../utility';
```

Replace it with:

```ts
import {
  tryParseJSONC,
  Range,
  getRunBlockReason,
  resolveActiveOperation,
} from '../utility';
```

- [ ] **Step 2: Read `operations` and `transportMethod`, then early-return when blocked**

In the `run()` action, the destructure currently reads:

```ts
          const {
            externalFragments,
            headerEditor,
            queryEditor,
            responseEditor,
            variableEditor,
            actions,
            operationName,
            documentAST,
            subscription,
            overrideOperationName,
            queryId,
            fetcher,
            transport,
          } = get();
```

Add `operations` and `transportMethod` to it:

```ts
          const {
            externalFragments,
            headerEditor,
            queryEditor,
            responseEditor,
            variableEditor,
            actions,
            operationName,
            operations,
            documentAST,
            subscription,
            overrideOperationName,
            queryId,
            fetcher,
            transport,
            transportMethod,
          } = get();
```

Immediately after the existing subscription guard:

```ts
          // If there's an active subscription, unsubscribe it and return
          if (subscription) {
            actions.stop();
            return;
          }
```

insert:

```ts
          // Mutations are forbidden over GET. Don't silently fall back to POST —
          // the UI disables Run in this state; bail out for any keyboard path too.
          const blockReason = getRunBlockReason(
            transportMethod,
            resolveActiveOperation(operations, operationName),
          );
          if (blockReason) {
            return;
          }
```

- [ ] **Step 3: Verify types compile**

Run: `yarn workspace @graphiql/react types:check`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add packages/graphiql-react/src/stores/execution.ts
git commit -m "Guard run() against mutations over GET"
```

---

## Task 3: Top-bar Run button + toggle highlight

**Files:**
- Modify: `packages/graphiql-react/src/components/top-bar/index.tsx`
- Modify: `packages/graphiql-react/src/components/top-bar/index.css`
- Test: `packages/graphiql-react/src/components/top-bar/top-bar.test.tsx`
- Modify: `packages/graphiql-react/src/components/top-bar/top-bar.stories.tsx`

- [ ] **Step 1: Write the failing tests**

In `packages/graphiql-react/src/components/top-bar/top-bar.test.tsx`, add these cases inside the `describe('TopBarView', ...)` block (after the existing `disables the Run button while fetching` test):

```ts
  it('disables the Run button when a mutation is blocked over GET', () => {
    renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can't be sent over GET — switch to POST."
      />,
    );
    expect(screen.getByRole('button', { name: /Run query/i })).toBeDisabled();
  });

  it('highlights the method toggle when a mutation is blocked over GET', () => {
    const { container } = renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can't be sent over GET — switch to POST."
      />,
    );
    expect(
      container.querySelector('.graphiql-top-bar-method-toggle--attention'),
    ).not.toBeNull();
  });

  it('does not highlight the toggle or disable Run when not blocked', () => {
    const { container } = renderTopBar(
      <TopBarView
        {...DEFAULTS}
        method="GET"
        supportedMethods={['GET', 'POST']}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Run query/i }),
    ).not.toBeDisabled();
    expect(
      container.querySelector('.graphiql-top-bar-method-toggle--attention'),
    ).toBeNull();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn workspace @graphiql/react vitest run src/components/top-bar/top-bar.test.tsx`
Expected: FAIL — `runDisabledReason` prop not handled; no `--attention` element; Run not disabled.

- [ ] **Step 3: Update `index.tsx`**

Replace the entire contents of `packages/graphiql-react/src/components/top-bar/index.tsx` with:

```tsx
// React Compiler can stale-cache the references returned by zustand hooks;
// opt this file out so `useGraphiQL` / `useGraphiQLActions` stay live.
'use no memo';

import type { FC } from 'react';
import type { HttpMethod } from '@graphiql/toolkit';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { KeycapHint, MODIFIER } from '../keycap-hint';
import { Tooltip } from '../tooltip';
import { GraphQLLogoIcon } from '../../icons';
import { cn, getRunBlockReason, resolveActiveOperation } from '../../utility';
import './index.css';

export type TopBarProps = {
  /** Version string shown in the brand pill. */
  version?: string;
};

export const TopBar: FC<TopBarProps> = ({ version }) => {
  const { run, setTransportMethod } = useGraphiQLActions();
  const isFetching = useGraphiQL(state => state.isFetching);
  const transport = useGraphiQL(state => state.transport);
  const transportMethod = useGraphiQL(state => state.transportMethod);
  const runDisabledReason = useGraphiQL(state =>
    getRunBlockReason(
      state.transportMethod,
      resolveActiveOperation(state.operations, state.operationName),
    ),
  );

  const url = transport?.url ?? '—';
  const method: HttpMethod = transportMethod ?? 'POST';
  const supportedMethods = transport?.supportedMethods ?? ['POST'];

  return (
    <TopBarView
      version={version}
      isFetching={isFetching}
      url={url}
      method={method}
      supportedMethods={supportedMethods}
      runDisabledReason={runDisabledReason}
      onRun={run}
      onSetMethod={setTransportMethod}
    />
  );
};

export type TopBarViewProps = {
  version?: string;
  isFetching: boolean;
  url: string;
  method: HttpMethod;
  supportedMethods: HttpMethod[];
  /** Non-null when Run is blocked; the string is the reason shown in a tooltip. */
  runDisabledReason?: string | null;
  onRun: () => void;
  onSetMethod: (method: HttpMethod) => void;
};

export const TopBarView: FC<TopBarViewProps> = ({
  version,
  isFetching,
  url,
  method,
  supportedMethods,
  runDisabledReason = null,
  onRun,
  onSetMethod,
}) => {
  const canSwitch = supportedMethods.length > 1;
  const otherMethod = supportedMethods.find(m => m !== method) ?? method;
  const isBlocked = runDisabledReason !== null;

  const runButton = (
    <button
      type="button"
      className="graphiql-top-bar-run"
      onClick={onRun}
      disabled={isFetching || isBlocked}
      aria-label="Run query"
    >
      Run
      <KeycapHint
        keys={[MODIFIER.Meta, MODIFIER.Enter]}
        ariaLabel="Run query shortcut"
      />
    </button>
  );

  return (
    <header className="graphiql-top-bar" role="banner">
      <div className="graphiql-top-bar-brand">
        <GraphQLLogoIcon className="graphiql-top-bar-logo" aria-hidden="true" />
        <span className="graphiql-top-bar-wordmark">GraphiQL</span>
        {version && <span className="graphiql-top-bar-version">{version}</span>}
      </div>

      <div className="graphiql-top-bar-divider" aria-hidden="true" />

      <div className="graphiql-top-bar-endpoint">
        {canSwitch ? (
          <Tooltip label={`Switch to ${otherMethod}`}>
            <button
              type="button"
              className={cn(
                'graphiql-top-bar-method-toggle',
                isBlocked && 'graphiql-top-bar-method-toggle--attention',
              )}
              onClick={() => onSetMethod(otherMethod)}
            >
              {method}
            </button>
          </Tooltip>
        ) : (
          <span className="graphiql-top-bar-endpoint-method">{method}</span>
        )}
        <span className="graphiql-top-bar-endpoint-url">{url}</span>
      </div>

      <button type="button" className="graphiql-top-bar-cmd">
        <span>Jump to schema</span>
        <KeycapHint
          keys={[MODIFIER.Meta, 'K']}
          ariaLabel="Open command palette"
        />
      </button>

      {isBlocked ? (
        <Tooltip label={runDisabledReason}>{runButton}</Tooltip>
      ) : (
        runButton
      )}
    </header>
  );
};
```

- [ ] **Step 4: Add the attention style**

In `packages/graphiql-react/src/components/top-bar/index.css`, after the `.graphiql-top-bar-method-toggle:hover { ... }` rule, add:

```css
.graphiql-top-bar-method-toggle--attention {
  color: oklch(var(--accent-orange));
  border-color: oklch(var(--accent-orange));
  animation: graphiql-top-bar-method-pulse 1.4s ease-in-out infinite;
}

@keyframes graphiql-top-bar-method-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn workspace @graphiql/react vitest run src/components/top-bar/top-bar.test.tsx`
Expected: PASS (existing + 3 new cases). The `Tooltip` wrapping Run requires a provider ancestor; the new blocked tests already use `renderTopBar` (which wraps in `Tooltip.Provider`).

- [ ] **Step 6: Add a blocked story**

The existing stories render the **connected** `TopBar` through `GraphiQLProvider`, so the blocked state can't be passed as args. Render the pure `TopBarView` directly instead.

In `packages/graphiql-react/src/components/top-bar/top-bar.stories.tsx`, change the import on line 3 from:

```tsx
import { TopBar } from './';
```

to:

```tsx
import { TopBar, TopBarView } from './';
```

Then append a new story at the end of the file:

```tsx
/** GET selected with a mutation in the editor: Run disabled, method toggle highlighted. */
export const MutationBlockedOverGet: Story = {
  render: () => (
    <Tooltip.Provider>
      <TopBarView
        version="v6.0.0-alpha.1"
        isFetching={false}
        url="https://api.example.com/graphql"
        method="GET"
        supportedMethods={['GET', 'POST']}
        runDisabledReason="Mutations can't be sent over GET — switch to POST."
        onRun={() => {}}
        onSetMethod={() => {}}
      />
    </Tooltip.Provider>
  ),
};
```

- [ ] **Step 7: Verify types compile**

Run: `yarn workspace @graphiql/react types:check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/graphiql-react/src/components/top-bar/
git commit -m "Disable top-bar Run and highlight toggle when mutation blocked over GET"
```

---

## Task 4: ExecuteButton — disable button + dropdown mutation items

**Files:**
- Modify: `packages/graphiql-react/src/components/execute-button/index.tsx`
- Test (create): `packages/graphiql-react/src/components/execute-button/execute-button.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/graphiql-react/src/components/execute-button/execute-button.test.tsx`:

```tsx
'use no memo';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { parse, OperationDefinitionNode } from 'graphql';
import { ExecuteButton } from './';

vi.mock('../provider', () => ({
  useGraphiQL: vi.fn(),
  useGraphiQLActions: vi.fn(),
}));

import { useGraphiQL, useGraphiQLActions } from '../provider';

const mockUseGraphiQL = vi.mocked(useGraphiQL);
const mockUseGraphiQLActions = vi.mocked(useGraphiQLActions);
const run = vi.fn();
const stop = vi.fn();
const setOperationName = vi.fn();

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

type State = {
  operations?: OperationDefinitionNode[];
  operationName?: string | null;
  isFetching?: boolean;
  overrideOperationName?: string | null;
  subscription?: unknown;
  transportMethod?: 'GET' | 'POST' | null;
};

function setup(state: State) {
  mockUseGraphiQL.mockImplementation((selector: (s: any) => any) =>
    selector({
      operations: state.operations ?? [],
      operationName: state.operationName ?? null,
      isFetching: state.isFetching ?? false,
      overrideOperationName: state.overrideOperationName ?? null,
      subscription: state.subscription ?? null,
      transportMethod: state.transportMethod ?? null,
    }),
  );
  mockUseGraphiQLActions.mockReturnValue({ run, stop, setOperationName } as any);
}

const renderButton = (ui: ReactNode) => render(<T.Provider>{ui}</T.Provider>);

describe('ExecuteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables the button for a single mutation while GET is selected', () => {
    setup({ operations: opsOf('mutation M { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables the button for a single query while GET is selected', () => {
    setup({ operations: opsOf('query Q { a }'), transportMethod: 'GET' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('enables the button for a single mutation while POST is selected', () => {
    setup({ operations: opsOf('mutation M { a }'), transportMethod: 'POST' });
    renderButton(<ExecuteButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('disables the mutation item but not the query item in the dropdown while GET is selected', async () => {
    const user = userEvent.setup();
    setup({
      operations: opsOf('query Q { a }\nmutation M { b }'),
      transportMethod: 'GET',
    });
    renderButton(<ExecuteButton />);
    await user.click(screen.getByRole('button'));
    const queryItem = await screen.findByRole('menuitem', { name: 'Q' });
    const mutationItem = screen.getByRole('menuitem', { name: 'M' });
    expect(queryItem).not.toHaveAttribute('aria-disabled', 'true');
    expect(mutationItem).toHaveAttribute('aria-disabled', 'true');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn workspace @graphiql/react vitest run src/components/execute-button/execute-button.test.tsx`
Expected: FAIL — button not disabled / dropdown items not disabled (current component ignores method + operation type).

- [ ] **Step 3: Update `index.tsx`**

Replace the entire contents of `packages/graphiql-react/src/components/execute-button/index.tsx` with:

```tsx
import type { FC } from 'react';
import { useGraphiQL, useGraphiQLActions } from '../provider';
import { PlayIcon, StopIcon } from '../../icons';
import { DropdownMenu } from '../dropdown-menu';
import { Tooltip } from '../tooltip';
import { KEY_MAP, formatShortcutForOS } from '../../constants';
import { pick, getRunBlockReason, resolveActiveOperation } from '../../utility';
import './index.css';

export const ExecuteButton: FC = () => {
  const { setOperationName, run, stop } = useGraphiQLActions();
  const {
    operations = [],
    operationName,
    isFetching,
    overrideOperationName,
    transportMethod,
  } = useGraphiQL(
    pick(
      'operations',
      'operationName',
      'isFetching',
      'overrideOperationName',
      'transportMethod',
    ),
  );
  const isSubscribed = useGraphiQL(state => Boolean(state.subscription));
  const hasOptions =
    operations.length > 1 && typeof overrideOperationName !== 'string';
  const isRunning = isFetching || isSubscribed;

  const runDisabledReason = getRunBlockReason(
    transportMethod,
    resolveActiveOperation(operations, operationName),
  );
  // Never block the Stop affordance — only a fresh run can be blocked.
  const isBlocked = !isRunning && runDisabledReason !== null;

  const label = isBlocked
    ? runDisabledReason!
    : `${isRunning ? 'Stop' : 'Execute'} query (${formatShortcutForOS(KEY_MAP.runQuery.key, 'Cmd')})`;
  const buttonProps = {
    type: 'button' as const,
    className: 'graphiql-execute-button',
    children: isRunning ? <StopIcon /> : <PlayIcon />,
    'aria-label': label,
  };

  return hasOptions && !isRunning ? (
    <DropdownMenu>
      <Tooltip label={label}>
        <DropdownMenu.Button {...buttonProps} />
      </Tooltip>

      <DropdownMenu.Content>
        {operations.map((operation, i) => {
          const opName = operation.name
            ? operation.name.value
            : `<Unnamed ${operation.operation}>`;
          return (
            <DropdownMenu.Item
              key={`${opName}-${i}`}
              disabled={getRunBlockReason(transportMethod, operation) !== null}
              onSelect={() => {
                const selectedOperationName = operation.name?.value;
                if (
                  selectedOperationName &&
                  selectedOperationName !== operationName
                ) {
                  setOperationName(selectedOperationName);
                }
                run();
              }}
            >
              {opName}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  ) : (
    <Tooltip label={label}>
      <button
        {...buttonProps}
        disabled={isBlocked}
        onClick={isRunning ? stop : run}
      />
    </Tooltip>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn workspace @graphiql/react vitest run src/components/execute-button/execute-button.test.tsx`
Expected: PASS (all 4 cases).

Note: if the dropdown menuitem in this Radix version exposes its disabled state via a `data-disabled` attribute rather than `aria-disabled`, adjust the two assertions in the dropdown test to match what the component actually renders — read the rendered output once and assert against the real attribute. The component code (`disabled` prop on `DropdownMenu.Item`) does not change.

- [ ] **Step 5: Verify types compile**

Run: `yarn workspace @graphiql/react types:check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/graphiql-react/src/components/execute-button/
git commit -m "Disable ExecuteButton and dropdown mutation items when blocked over GET"
```

---

## Task 5: Full validation sweep

**Files:** none (verification only).

- [ ] **Step 1: Run the full react test suite**

Run: `yarn workspace @graphiql/react test`
Expected: PASS — no regressions across the package.

- [ ] **Step 2: Run the type check**

Run: `yarn workspace @graphiql/react types:check`
Expected: PASS.

- [ ] **Step 3: Manual/visual confirmation (optional but recommended)**

Run Storybook for `@graphiql/react` and open the `TopBar` → `MutationBlockedOverGet` story. Confirm: the method toggle is highlighted (orange, pulsing) and the Run button is disabled with the explanatory tooltip.

- [ ] **Step 4: Update the PR test plan**

In PR #4360's description, add a checklist item under the test plan:
`- [ ] With GET selected, a mutation cannot be run: Run is disabled with a tooltip, the method toggle is highlighted, and ExecuteButton's mutation dropdown items are disabled.`

---

## Self-Review notes

- **Spec coverage:** Core rule (Task 1), active-operation resolution incl. ambiguous→not-blocked (Task 1 tests), `run()` guard (Task 2), top-bar disable + tooltip + highlight (Task 3), ExecuteButton single + dropdown (Task 4), context-level single source of truth via shared helper consumed in all three sites (Tasks 2–4), validation incl. story (Tasks 3 & 5). All spec sections map to a task.
- **Selector vs. state field:** implemented as a selector over store state (per spec), not a materialized field.
- **Type consistency:** helper names `getRunBlockReason` / `resolveActiveOperation` / `MUTATION_OVER_GET_REASON` and prop `runDisabledReason` are used identically across Tasks 1–4.
