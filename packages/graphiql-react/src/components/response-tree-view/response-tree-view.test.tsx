'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponseTreeView } from './';

describe('ResponseTreeView', () => {
  it('renders a string scalar value', () => {
    render(<ResponseTreeView data="hello" />);
    expect(screen.getByText(/"hello"/)).toBeInTheDocument();
  });

  it('renders a number scalar value', () => {
    render(<ResponseTreeView data={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders null', () => {
    render(<ResponseTreeView data={null} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders boolean false', () => {
    render(<ResponseTreeView data={false} />);
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('renders top-level object keys directly (no synthetic root wrapper)', () => {
    render(<ResponseTreeView data={{ data: { id: '1' }, errors: [] }} />);
    // Both top-level envelope keys appear directly — no extra wrapper row
    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('errors')).toBeInTheDocument();
  });

  it('renders a nested object with child count summary when collapsed', () => {
    // The summary appears on nested object values, not the top-level keys
    render(
      <ResponseTreeView
        data={{ nested: { a: 1, b: 2 } }}
        initiallyExpandedDepth={0}
      />,
    );
    expect(screen.getByText('Object {2}')).toBeInTheDocument();
  });

  it('renders an array with child count summary when collapsed', () => {
    render(<ResponseTreeView data={[1, 2, 3]} initiallyExpandedDepth={0} />);
    expect(screen.getByText('Array [3]')).toBeInTheDocument();
  });

  it('top-level object keys are expanded by default', () => {
    render(<ResponseTreeView data={{ name: 'GraphiQL' }} />);
    // child value should be visible without any interaction
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText(/"GraphiQL"/)).toBeInTheDocument();
  });

  it('nested objects are collapsed by default', () => {
    // top-level keys (depth 0) expand by default; deeper keys do not.
    render(
      <ResponseTreeView data={{ outer: { middle: { inner: 'value' } } }} />,
    );
    // `outer` (depth 0) is expanded — `middle` is visible
    expect(screen.getByText('outer')).toBeInTheDocument();
    expect(screen.getByText('middle')).toBeInTheDocument();
    // `middle` (depth 1) is collapsed — `inner` is not visible
    expect(screen.queryByText('inner')).toBeNull();
  });

  it('expands a collapsed node on toggle click', async () => {
    const user = userEvent.setup();
    render(
      <ResponseTreeView data={{ outer: { middle: { inner: 'value' } } }} />,
    );
    // `middle` (depth 1) starts collapsed
    const collapsed = screen
      .getAllByRole('button')
      .find(b => b.getAttribute('aria-expanded') === 'false');
    expect(collapsed).toBeDefined();
    await user.click(collapsed!);
    expect(screen.getByText('inner')).toBeInTheDocument();
  });

  it('collapses an expanded top-level key on toggle click', async () => {
    const user = userEvent.setup();
    render(<ResponseTreeView data={{ hero: { id: '1' } }} />);
    // hero is expanded by default (depth 0 < initiallyExpandedDepth 1)
    const toggle = screen.getByRole('button', { name: /collapse/i });
    await user.click(toggle);
    // hero's child `id` is no longer visible
    expect(screen.queryByText('id')).toBeNull();
  });

  it('toggle button has correct aria-expanded when open', () => {
    // Need a nested object so there's a toggle button at the top level
    render(<ResponseTreeView data={{ group: { a: 1 } }} />);
    const btn = screen.getByRole('button', { name: /collapse/i });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggle button has correct aria-expanded when closed', () => {
    render(
      <ResponseTreeView
        data={{ group: { a: 1 } }}
        initiallyExpandedDepth={0}
      />,
    );
    const btn = screen.getByRole('button', { name: /expand/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders a large array count correctly', () => {
    render(
      <ResponseTreeView
        data={Array.from({ length: 100 }, (_, i) => i)}
        initiallyExpandedDepth={0}
      />,
    );
    expect(screen.getByText('Array [100]')).toBeInTheDocument();
  });

  it('renders empty object with no rows', () => {
    render(<ResponseTreeView data={{}} />);
    expect(
      document.querySelector('.graphiql-response-tree'),
    ).toBeInTheDocument();
    expect(document.querySelector('.graphiql-tree-row')).toBeNull();
  });

  it('renders empty array', () => {
    render(<ResponseTreeView data={[]} initiallyExpandedDepth={0} />);
    expect(screen.getByText('Array [0]')).toBeInTheDocument();
  });

  it('renders array items with numeric keys when expanded', () => {
    render(<ResponseTreeView data={['a', 'b']} initiallyExpandedDepth={1} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders sibling top-level envelope keys (data + errors)', () => {
    render(
      <ResponseTreeView
        data={{
          data: { hero: { name: 'R2-D2' } },
          errors: [{ message: 'oops' }],
        }}
      />,
    );
    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('errors')).toBeInTheDocument();
  });
});
