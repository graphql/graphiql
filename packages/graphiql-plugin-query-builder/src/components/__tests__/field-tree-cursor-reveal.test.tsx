import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
} from 'graphql';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FieldTree } from '../field-tree';

beforeAll(() => {
  // jsdom doesn't implement scrollIntoView, which the reveal effect calls.
  Element.prototype.scrollIntoView = vi.fn();
});

const ChildType = new GraphQLObjectType({
  name: 'Child',
  fields: { leaf: { type: GraphQLString } },
});

const ParentType = new GraphQLObjectType({
  name: 'Parent',
  fields: { child: { type: ChildType } },
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: { parent: { type: ParentType } },
});

const schema = new GraphQLSchema({ query: QueryType });

function doc(query: string) {
  return parse(query, { noLocation: true });
}

function renderTree(cursorPath?: string[]) {
  return render(
    <FieldTree
      type={QueryType}
      path={[]}
      doc={doc('{ __typename }')}
      schema={schema}
      cursorPath={cursorPath}
      onToggle={() => {}}
      onSetArg={() => {}}
    />,
  );
}

describe('FieldTree — cursor reveal', () => {
  it('auto-expands ancestors of the cursor field', () => {
    renderTree(['parent', 'child']);
    // `parent` is an ancestor of the cursor, so its `child` row is revealed.
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('re-expands a collapsed ancestor when the cursor moves again', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTree(['parent', 'child']);
    expect(screen.getByText('child')).toBeInTheDocument();

    // Manually collapse `parent`.
    await user.click(screen.getByRole('button', { name: /parent/i }));
    expect(screen.queryByText('child')).not.toBeInTheDocument();

    // A later cursor move hands us a fresh array with the same path. The tree
    // must follow the cursor and re-expand `parent`, even though it's still the
    // same ancestor (`isAncestor` never changed).
    rerender(
      <FieldTree
        type={QueryType}
        path={[]}
        doc={doc('{ __typename }')}
        schema={schema}
        cursorPath={['parent', 'child']}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
