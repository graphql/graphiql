import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ResolverTrace } from '@graphiql/toolkit';
import { TraceFooter } from './';

const TRACES: ResolverTrace[] = [
  {
    path: ['user'],
    parentType: 'Query',
    fieldName: 'user',
    returnType: 'User',
    startOffsetMs: 0,
    durationMs: 45,
  },
  {
    path: ['user', 'name'],
    parentType: 'User',
    fieldName: 'name',
    returnType: 'String',
    startOffsetMs: 10,
    durationMs: 5,
  },
];

describe('TraceFooter', () => {
  it('renders the TRACE eyebrow label', () => {
    render(<TraceFooter traces={TRACES} totalMs={100} />);
    expect(screen.getByText('TRACE')).toBeInTheDocument();
  });

  it('shows resolver count and total time in the header', () => {
    render(<TraceFooter traces={TRACES} totalMs={100} />);
    expect(screen.getByText(/2 resolvers/)).toBeInTheDocument();
    expect(screen.getByText(/100ms/)).toBeInTheDocument();
  });

  it('uses singular "resolver" when there is exactly one', () => {
    render(<TraceFooter traces={[TRACES[0]!]} totalMs={50} />);
    expect(screen.getByText(/1 resolver[^s]/)).toBeInTheDocument();
  });

  it('renders a row for each trace', () => {
    render(<TraceFooter traces={TRACES} totalMs={100} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('renders duration in ms for each row', () => {
    render(<TraceFooter traces={TRACES} totalMs={100} />);
    expect(screen.getByText('45ms')).toBeInTheDocument();
    expect(screen.getByText('5ms')).toBeInTheDocument();
  });

  it('has an accessible label on the list', () => {
    render(<TraceFooter traces={TRACES} totalMs={100} />);
    expect(
      screen.getByRole('list', { name: 'Resolver trace' }),
    ).toBeInTheDocument();
  });

  it('indents nested fields based on path depth', () => {
    const { container } = render(<TraceFooter traces={TRACES} totalMs={100} />);
    const nameSpan = container.querySelector(
      '.graphiql-trace-row:nth-child(2) .graphiql-trace-name',
    ) as HTMLElement;
    // path.length === 2 → paddingLeft 16px
    expect(nameSpan.style.paddingLeft).toBe('16px');
  });

  it('rounds sub-millisecond durations to 0ms', () => {
    const subMs: ResolverTrace = {
      ...TRACES[0]!,
      durationMs: 0.3,
    };
    render(<TraceFooter traces={[subMs]} totalMs={50} />);
    expect(screen.getByText('0ms')).toBeInTheDocument();
  });
});
