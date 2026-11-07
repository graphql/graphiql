import { act, renderHook } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  print,
} from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { fieldSegment } from '../../lib/ast-path';
import { useWorkingDocument } from '../use-working-document';
import { installGraphiQLReactMock } from './graphiql-react-mock';

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

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: { first: { type: GraphQLString }, second: { type: GraphQLString } },
  }),
});

describe('working document synchronization', () => {
  it('commits external edits without exposing the previous document to children', () => {
    const state = installGraphiQLReactMock({ schema, queryText: '{ first }' });
    const committed: string[] = [];
    const { rerender } = renderHook(() => {
      const { workingDoc } = useWorkingDocument();
      useLayoutEffect(() => {
        committed.push(print(workingDoc));
      });
    });
    committed.length = 0;

    state.queryText = '{ second }';
    rerender();

    expect(committed).toEqual(['{\n  second\n}']);
  });

  it('keeps the last valid document during incomplete edits and resets on clear', () => {
    const state = installGraphiQLReactMock({ schema, queryText: '{ first }' });
    const { result, rerender } = renderHook(useWorkingDocument);
    const first = result.current.workingDoc;

    state.queryText = '{ first(';
    rerender();
    expect(result.current.workingDoc).toBe(first);

    state.queryText = '{ second }';
    rerender();
    expect(print(result.current.workingDoc)).toContain('second');
    expect(print(result.current.workingDoc)).not.toContain('first');

    state.queryText = '';
    rerender();
    expect(print(result.current.workingDoc)).toBe('{\n  __typename\n}');
  });

  it('keeps the working document identity when the editor echoes a builder edit', () => {
    const state = installGraphiQLReactMock({
      schema,
      queryText: '{ first }',
      updateActiveTabValues(values) {
        if (values.query !== undefined) {
          state.queryText = values.query;
        }
      },
    });
    const { result, rerender } = renderHook(useWorkingDocument);
    act(() => result.current.handleToggle([fieldSegment('second')]));
    const edited = result.current.workingDoc;
    expect(print(edited)).toContain('first');
    expect(print(edited)).toContain('second');

    rerender();
    expect(result.current.workingDoc).toBe(edited);
  });
});
