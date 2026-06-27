import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
} from 'graphql';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fieldSegment } from '../../lib/document-mutator';
import { type PathSegment } from '../../lib/ast-path';
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

function renderTree(cursorPath?: PathSegment[]) {
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
    renderTree([fieldSegment('parent'), fieldSegment('child')]);
    // `parent` is an ancestor of the cursor, so its `child` row is revealed.
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('re-expands a collapsed ancestor when the cursor moves again', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTree([
      fieldSegment('parent'),
      fieldSegment('child'),
    ]);
    expect(screen.getByText('child')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /parent/i }));
    expect(screen.queryByText('child')).not.toBeInTheDocument();

    // A fresh array with the same path must still trigger re-expansion; the
    // tree can't skip it just because the ancestor path string is unchanged.
    rerender(
      <FieldTree
        type={QueryType}
        path={[]}
        doc={doc('{ __typename }')}
        schema={schema}
        cursorPath={[fieldSegment('parent'), fieldSegment('child')]}
        onToggle={() => {}}
        onSetArg={() => {}}
      />,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
