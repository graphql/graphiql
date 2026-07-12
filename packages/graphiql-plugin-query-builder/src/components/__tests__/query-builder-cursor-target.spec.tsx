/**
 * The editor cursor is the single source of truth for the active editing
 * target: the builder shows whichever definition the cursor sits in, and the
 * focus / Back-to-query controls work by moving the editor cursor. Uses a stub
 * Monaco editor to drive and observe cursor moves, with fake timers to flush
 * the cursor hook's debounce.
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

/**
 * A minimal Monaco stub. The test drives the cursor with `moveCursorTo`, and
 * programmatic `setPosition` calls (from the builder moving the cursor) are
 * recorded and applied so the stub cursor reflects them.
 */
function makeFakeEditor(getText: () => string) {
  let cursorCb: ((e: { reason: number }) => void) | undefined;
  let offset = 0;
  const setPositions: { offset: number }[] = [];
  return {
    setPositions,
    editor: {
      getModel: () => ({
        getValue: getText,
        getOffsetAt: () => offset,
        getPositionAt: (o: number) => ({ offset: o }),
      }),
      getPosition: () => ({ offset }),
      getValue: getText,
      setValue() {},
      setPosition(pos: { offset: number }) {
        setPositions.push(pos);
        offset = pos.offset;
      },
      onDidChangeCursorPosition(cb: (e: { reason: number }) => void) {
        cursorCb = cb;
        return { dispose() {} };
      },
    },
    moveCursorTo(next: number) {
      offset = next;
      // reason 3 === CursorChangeReason.Explicit in the mock.
      cursorCb?.({ reason: 3 });
    },
  };
}

const QUERY = `{ user { ...UserFields } }
fragment UserFields on User { name }`;

describe('QueryBuilder — cursor as the editing target', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('follows the editor cursor between the operation and a fragment', () => {
    const fake = makeFakeEditor(() => QUERY);
    installGraphiQLReactMock({
      schema: TestSchema,
      queryText: QUERY,
      queryEditor: fake.editor,
    });
    render(<QueryBuilder />);

    // The cursor starts in the operation.
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();

    // Into the fragment: the focused editor opens.
    act(() => {
      fake.moveCursorTo(QUERY.indexOf('name'));
      vi.advanceTimersByTime(100);
    });
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();

    // Back into the operation: the focused editor closes.
    act(() => {
      fake.moveCursorTo(QUERY.indexOf('user'));
      vi.advanceTimersByTime(100);
    });
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();
  });

  it('moves the editor cursor into the operation on Back to query', () => {
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
    expect(
      screen.getByRole('button', { name: /back to query/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to query/i }));

    // The operation view is shown again...
    expect(
      screen.queryByRole('button', { name: /back to query/i }),
    ).not.toBeInTheDocument();
    // ...because the editor cursor was moved into the operation (which sits
    // before the fragment definition in the text).
    const last = fake.setPositions.at(-1);
    expect(last).toBeDefined();
    expect(last!.offset).toBeLessThan(QUERY.indexOf('fragment'));
  });
});
