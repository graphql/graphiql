/**
 * Regression test: the cursor reveal must cascade into a collapsed "Possible
 * types" section. That section (for an interface field) keeps its own collapse
 * state, so when the cursor lands on a field nested inside one of its type
 * conditions it has to open — otherwise the reveal stops at the section and the
 * deep field is never shown.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { afterEach, describe, expect, it } from 'vitest';
import { __state } from '../../__mocks__/@graphiql/react';
import { QueryBuilder } from '../query-builder';

const Node = new GraphQLInterfaceType({
  name: 'Node',
  fields: { id: { type: GraphQLID } },
});
const Impl = new GraphQLObjectType({
  name: 'Impl',
  interfaces: [Node],
  fields: { id: { type: GraphQLID }, extra: { type: GraphQLString } },
});
const TestSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: { node: { type: Node } },
  }),
  types: [Impl],
});

// Stub editor whose cursor resolves to `extra`, nested inside `... on Impl`.
function setupEditor() {
  const query = '{ node { ... on Impl { extra } } }';
  let cursorCb: ((e: { reason: number }) => void) | undefined;
  __state.schema = TestSchema;
  __state.queryText = query;
  __state.queryEditor = {
    onDidChangeCursorPosition(cb: (e: { reason: number }) => void) {
      cursorCb = cb;
      return { dispose() {} };
    },
    getModel: () => ({
      getValue: () => query,
      getOffsetAt: () => query.indexOf('extra') + 1,
    }),
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    getValue: () => query,
    setValue() {},
    setPosition() {},
  };
  return { fireUserCursor: () => act(() => cursorCb?.({ reason: 3 })) };
}

const deepFieldVisible = () =>
  screen
    .getAllByTestId('field-row')
    .some(
      r => r.querySelector('.graphiql-qb-field-name')?.textContent === 'extra',
    );

afterEach(() => {
  __state.queryEditor = null;
});

describe('cursor reveal into a collapsed Possible types section', () => {
  it('re-opens the section so the nested field is revealed', async () => {
    const { fireUserCursor } = setupEditor();
    render(<QueryBuilder />);

    // Reveal cascades down to `extra` (mount + initial recompute).
    await waitFor(() => expect(deepFieldVisible()).toBe(true));

    // Collapse the Possible types section by hand — the deep field disappears.
    fireEvent.click(
      document.querySelector('.graphiql-qb-possible-types-header')!,
    );
    expect(deepFieldVisible()).toBe(false);

    // A fresh user cursor move into the condition re-opens the section.
    fireUserCursor();
    await waitFor(() => expect(deepFieldVisible()).toBe(true));
  });
});
