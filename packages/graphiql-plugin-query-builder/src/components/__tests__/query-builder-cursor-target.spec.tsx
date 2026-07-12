/**
 * Exercises the cursor-driven active-editing-target state machine, which picks
 * between the operation view and a focused fragment editor. Uses a stub Monaco
 * editor so cursor moves can be simulated, and fake timers to flush the cursor
 * hook's debounce.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
import { QueryBuilder } from '../query-builder';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return {
    ...actual,
    useGraphiQL: vi.fn(),
    useGraphiQLActions: vi.fn(),
    useMonaco: vi.fn(),
  };
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: { name: { type: GraphQLString }, email: { type: GraphQLString } },
});
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: { user: { type: UserType } },
});
const TestSchema = new GraphQLSchema({ query: QueryType });

/** A minimal Monaco stub whose reported cursor offset the test controls. */
function makeFakeEditor(getText: () => string) {
  let cursorCb: ((e: { reason: number }) => void) | undefined;
  let focusCb: (() => void) | undefined;
  let offset = 0;
  return {
    editor: {
      getModel: () => ({ getValue: getText, getOffsetAt: () => offset }),
      getPosition: () => ({}),
      getValue: getText,
      setValue() {},
      setPosition() {},
      onDidChangeCursorPosition(cb: (e: { reason: number }) => void) {
        cursorCb = cb;
        return { dispose() {} };
      },
      onDidFocusEditorText(cb: () => void) {
        focusCb = cb;
        return { dispose() {} };
      },
    },
    moveCursorTo(next: number) {
      offset = next;
      // reason 3 === CursorChangeReason.Explicit in the mock.
      cursorCb?.({ reason: 3 });
    },
    /** Regain focus without moving the cursor (a click at the current spot). */
    focus() {
      focusCb?.();
    },
  };
}

const QUERY = `{ user { ...UserFields } }
fragment UserFields on User { name }`;

describe('QueryBuilder — cursor-driven editing target', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reopens the fragment editor when the cursor re-enters after Back to query', () => {
    const fake = makeFakeEditor(() => QUERY);
    installGraphiQLReactMock({
      schema: TestSchema,
      queryText: QUERY,
      queryEditor: fake.editor,
    });
    render(<QueryBuilder />);

    const insideFragment = QUERY.indexOf('name');

    // Move the cursor into the fragment: the focused editor opens.
    act(() => {
      fake.moveCursorTo(insideFragment);
      vi.advanceTimersByTime(100);
    });
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();

    // Back to query returns to the operation view.
    fireEvent.click(screen.getByRole('button', { name: /back to query/i }));
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();

    // Clicking again inside the *same* fragment must reopen the editor — the
    // regression: this used to be ignored because the definition was unchanged.
    act(() => {
      fake.moveCursorTo(insideFragment + 1);
      vi.advanceTimersByTime(100);
    });
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();
  });

  it('reopens the fragment editor on refocus even at the unchanged cursor spot', () => {
    const fake = makeFakeEditor(() => QUERY);
    installGraphiQLReactMock({
      schema: TestSchema,
      queryText: QUERY,
      queryEditor: fake.editor,
    });
    render(<QueryBuilder />);

    act(() => {
      fake.moveCursorTo(QUERY.indexOf('name'));
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(screen.getByRole('button', { name: /back to query/i }));
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();

    // Clicking back into the editor at the same spot fires no cursor-move event,
    // but the editor regains focus — which must re-sync to the fragment.
    act(() => {
      fake.focus();
      vi.advanceTimersByTime(100);
    });
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();
  });
});
