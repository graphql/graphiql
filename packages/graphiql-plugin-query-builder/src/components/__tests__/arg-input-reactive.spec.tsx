/**
 * Reactive harness tests for ArgInput / ListArgInput.
 *
 * The harness holds query state, re-derives each input's prop value from the
 * parsed document, and feeds edits back through it — the same shape as the
 * QueryBuilder, where the working document updates synchronously. The
 * @graphiql/react mock is NOT involved; this exercises the input controls in
 * isolation.
 *
 * Test 1: clicking "Add item" must NOT cause the new input to vanish. An empty
 * list element can't be represented in the document, so the list control keeps
 * it as a local row and only adopts the prop when its non-empty projection
 * actually differs.
 *
 * Test 2: multi-char scalar typing accumulates correctly (the control reads
 * straight from props now that the document updates synchronously).
 *
 * Test 3: genuine external document edits are reflected in the input.
 */
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
  print,
} from 'graphql';
import { type FC, useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  argValueToValueNode,
  getFieldArgValues,
  setFieldArgument,
  type ArgValue,
} from '../../lib/document-mutator';
import { ArgInput } from '../arg-input';

const TestQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    items: {
      type: new GraphQLList(GraphQLString),
      args: {
        ids: { type: new GraphQLList(GraphQLInt) },
      },
    },
    search: {
      type: GraphQLString,
      args: {
        q: { type: GraphQLString },
      },
    },
  },
});

const _TestSchema = new GraphQLSchema({ query: TestQueryType });

function listIntArg(name = 'ids') {
  return {
    name,
    type: new GraphQLList(GraphQLInt),
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

function stringArg(name = 'q') {
  return {
    name,
    type: GraphQLString,
    description: null,
    defaultValue: undefined,
    deprecationReason: null,
    extensions: {},
    astNode: undefined,
  } as Parameters<typeof ArgInput>[0]['arg'];
}

/**
 * ReactiveHarness drives the real echo loop:
 *   user action → onChange → apply to doc → print → setQuery → re-render → new prop value
 *
 * This is the same sequence the real QueryBuilder goes through; the test
 * does it without the @graphiql/react mock so the reconciliation logic in
 * ArgInput / ListArgInput is exercised against a real React state update.
 */
type HarnessProps = {
  initialQuery: string;
  argName: string;
  arg: Parameters<typeof ArgInput>[0]['arg'];
  /** field path in the query (e.g. ['items'] for `{ items }`) */
  path: string[];
  /** expose setQuery so tests can simulate external edits */
  onSetQueryRef?: (setter: (q: string) => void) => void;
};

const ReactiveHarness: FC<HarnessProps> = ({
  initialQuery,
  argName,
  arg,
  path,
  onSetQueryRef,
}) => {
  const [query, setQuery] = useState(initialQuery);

  // Ref-style callback instead of forwardRef — keeps the harness simple.
  if (onSetQueryRef) {
    onSetQueryRef(setQuery);
  }

  const doc = (() => {
    try {
      return parse(query);
    } catch {
      return parse('{ __typename }');
    }
  })();

  const argValues = getFieldArgValues(doc, path);
  const value: ArgValue = argValues[argName] ?? [];

  const handleChange = (next: ArgValue) => {
    const valueNode = argValueToValueNode(arg.type, next);
    const nextDoc = setFieldArgument(doc, path, argName, valueNode);
    setQuery(print(nextDoc));
  };

  return (
    <div data-testid="harness">
      <ArgInput arg={arg} value={value} onChange={handleChange} />
      <pre data-testid="query">{query}</pre>
    </div>
  );
};

describe('arg-input reactive: add list item persists through echo re-render', () => {
  it('added empty Int item stays visible after the document echo', async () => {
    const user = userEvent.setup();

    render(
      <ReactiveHarness
        initialQuery="{ items }"
        argName="ids"
        arg={listIntArg('ids')}
        path={['items']}
      />,
    );

    expect(screen.queryByRole('spinbutton', { name: 'ids' })).toBeNull();

    // Clicking emits [''] → onChange → setQuery → re-render with prop [] (empty leaf dropped).
    await user.click(screen.getByRole('button', { name: /add item/i }));

    // The input must survive the echo re-render; the empty item must not be clobbered.
    const input = screen.getByRole('spinbutton', { name: 'ids' });
    expect(input).toBeInTheDocument();

    await user.type(input, '5');

    const queryEl = screen.getByTestId('query');
    expect(queryEl.textContent).toMatch(/ids: \[5\]/);
  });
});

describe('arg-input reactive: multi-char scalar typing', () => {
  it('typing "hello" into a String arg produces the full value', async () => {
    const user = userEvent.setup();

    render(
      <ReactiveHarness
        initialQuery="{ search }"
        argName="q"
        arg={stringArg('q')}
        path={['search']}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'q' });
    await user.type(input, 'hello');

    const queryEl = screen.getByTestId('query');
    expect(queryEl.textContent).toMatch(/q: "hello"/);
  });
});

describe('arg-input reactive: external document change re-syncs', () => {
  it('programmatic setQuery to a different value updates the displayed input', async () => {
    let externalSetQuery: ((q: string) => void) | undefined;

    render(
      <ReactiveHarness
        initialQuery='{ search(q: "old") }'
        argName="q"
        arg={stringArg('q')}
        path={['search']}
        onSetQueryRef={setter => {
          externalSetQuery = setter;
        }}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'q' });
    expect(input).toHaveValue('old');

    act(() => {
      externalSetQuery!('{ search(q: "external") }');
    });

    expect(screen.getByRole('textbox', { name: 'q' })).toHaveValue('external');
  });
});
