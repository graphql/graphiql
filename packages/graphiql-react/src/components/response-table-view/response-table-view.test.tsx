'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponseTableView } from './';

const USERS = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
];

const PRODUCTS = [
  { sku: 'A1', price: 9.99 },
  { sku: 'B2', price: 14.99 },
];

describe('ResponseTableView', () => {
  describe('non-list responses', () => {
    it('shows the empty state for null data', () => {
      render(<ResponseTableView data={null} />);
      expect(
        screen.getByText('Table view requires a list response.'),
      ).toBeInTheDocument();
    });

    it('shows the empty state for a primitive', () => {
      render(<ResponseTableView data={42} />);
      expect(
        screen.getByText('Table view requires a list response.'),
      ).toBeInTheDocument();
    });

    it('shows the empty state for an object with no list fields', () => {
      render(<ResponseTableView data={{ data: { scalar: 'hello' } }} />);
      expect(
        screen.getByText('Table view requires a list response.'),
      ).toBeInTheDocument();
    });

    it('shows the empty state for a primitive array', () => {
      render(<ResponseTableView data={{ data: { tags: ['a', 'b', 'c'] } }} />);
      expect(
        screen.getByText('Table view requires a list response.'),
      ).toBeInTheDocument();
    });

    it('shows the empty state for an empty array', () => {
      render(<ResponseTableView data={{ data: { users: [] } }} />);
      expect(
        screen.getByText('Table view requires a list response.'),
      ).toBeInTheDocument();
    });
  });

  describe('list-shaped responses', () => {
    it('renders a table for a top-level array of objects', () => {
      render(<ResponseTableView data={{ data: { users: USERS } }} />);
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('renders column headers from the first object keys', () => {
      render(<ResponseTableView data={{ data: { users: USERS } }} />);
      expect(
        screen.getByRole('columnheader', { name: 'id' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'name' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'role' }),
      ).toBeInTheDocument();
    });

    it('renders one row per element', () => {
      render(<ResponseTableView data={{ data: { users: USERS } }} />);
      const rows = screen.getAllByRole('row');
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3);
    });

    it('renders cell values as strings', () => {
      render(<ResponseTableView data={{ data: { products: PRODUCTS } }} />);
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('9.99')).toBeInTheDocument();
    });

    it('renders null/undefined cells as an em dash', () => {
      const rows = [{ id: 1, name: null }];
      render(<ResponseTableView data={{ data: { rows } }} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders nested objects as shorthand', () => {
      const rows = [{ id: 1, address: { city: 'NYC', zip: '10001' } }];
      render(<ResponseTableView data={{ data: { rows } }} />);
      expect(screen.getByText('Object {2}')).toBeInTheDocument();
    });

    it('renders nested arrays as shorthand', () => {
      const rows = [{ id: 1, tags: ['a', 'b'] }];
      render(<ResponseTableView data={{ data: { rows } }} />);
      expect(screen.getByText('Array [2]')).toBeInTheDocument();
    });

    it('handles ragged rows (missing keys in some rows)', () => {
      const ragged = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob' },
      ];
      render(<ResponseTableView data={{ data: { ragged } }} />);
      const cells = screen.getAllByRole('cell');
      // 3 cols * 2 rows = 6 cells; last row missing 'role' shows '—'
      expect(cells).toHaveLength(6);
      // The missing cell should be '—'
      const emDashes = cells.filter(c => c.textContent === '—');
      expect(emDashes).toHaveLength(1);
    });

    it('unions column keys across all rows for ragged data', () => {
      const ragged = [
        { id: 1, a: 'x' },
        { id: 2, b: 'y' },
      ];
      render(<ResponseTableView data={{ data: { ragged } }} />);
      expect(
        screen.getByRole('columnheader', { name: 'a' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'b' }),
      ).toBeInTheDocument();
    });

    it('picks the first list-of-objects field when multiple list fields exist', () => {
      const data = {
        data: { users: USERS, products: PRODUCTS },
      };
      render(<ResponseTableView data={data} />);
      // 'id', 'name', 'role' are users columns; products has 'sku', 'price'
      expect(
        screen.getByRole('columnheader', { name: 'id' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('columnheader', { name: 'sku' }),
      ).not.toBeInTheDocument();
    });

    it('finds a nested list field', () => {
      const data = { data: { page: { items: USERS } } };
      render(<ResponseTableView data={data} />);
      expect(
        screen.getByRole('columnheader', { name: 'name' }),
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses a caption to describe the source field', () => {
      render(<ResponseTableView data={{ data: { users: USERS } }} />);
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    it('wraps the empty state in a role=status region', () => {
      const { container } = render(<ResponseTableView data={null} />);
      expect(
        container.querySelector('.graphiql-response-table-empty'),
      ).toHaveAttribute('role', 'status');
    });
  });
});
