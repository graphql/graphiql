'use no memo';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MethodPill } from './';

describe('MethodPill', () => {
  it('renders QRY for query operations', () => {
    render(<MethodPill operation="query" />);
    expect(screen.getByText('QRY')).toBeInTheDocument();
  });

  it('renders MUT for mutations', () => {
    render(<MethodPill operation="mutation" />);
    expect(screen.getByText('MUT')).toBeInTheDocument();
  });

  it('renders SUB for subscriptions', () => {
    render(<MethodPill operation="subscription" />);
    expect(screen.getByText('SUB')).toBeInTheDocument();
  });

  it('renders ERR for invalid operations', () => {
    render(<MethodPill operation="invalid" />);
    expect(screen.getByText('ERR')).toBeInTheDocument();
  });
});
