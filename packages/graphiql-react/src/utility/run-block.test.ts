import { describe, it, expect } from 'vitest';
import { parse, OperationDefinitionNode } from 'graphql';
import {
  getRunBlockReason,
  resolveActiveOperation,
  MUTATION_REQUIRES_POST_REASON,
} from './run-block';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const QUERY = opsOf('query Q { a }');
const MUTATION = opsOf('mutation M { a }');
const MIXED = opsOf('query Q { a }\nmutation M { b }');

describe('resolveActiveOperation', () => {
  it('returns undefined when there are no operations', () => {
    expect(resolveActiveOperation([], null)).toBeUndefined();
    expect(resolveActiveOperation(undefined, null)).toBeUndefined();
  });

  it('returns the sole operation regardless of operationName', () => {
    expect(resolveActiveOperation(QUERY, null)).toBe(QUERY[0]);
    expect(resolveActiveOperation(QUERY, 'nope')).toBe(QUERY[0]);
  });

  it('returns the operation matching operationName when there are several', () => {
    expect(resolveActiveOperation(MIXED, 'M')).toBe(MIXED[1]);
  });

  it('returns undefined when several operations and no match', () => {
    expect(resolveActiveOperation(MIXED, null)).toBeUndefined();
    expect(resolveActiveOperation(MIXED, 'unknown')).toBeUndefined();
  });
});

describe('getRunBlockReason', () => {
  it('blocks a mutation over GET', () => {
    expect(getRunBlockReason('GET', MUTATION[0])).toBe(
      MUTATION_REQUIRES_POST_REASON,
    );
  });

  it('blocks a mutation over QUERY', () => {
    expect(getRunBlockReason('QUERY', MUTATION[0])).toBe(
      MUTATION_REQUIRES_POST_REASON,
    );
  });

  it('allows a query over GET', () => {
    expect(getRunBlockReason('GET', QUERY[0])).toBeNull();
  });

  it('allows a query over QUERY', () => {
    expect(getRunBlockReason('QUERY', QUERY[0])).toBeNull();
  });

  it('allows a mutation over POST', () => {
    expect(getRunBlockReason('POST', MUTATION[0])).toBeNull();
  });

  it('treats a null/undefined method as POST (allowed)', () => {
    expect(getRunBlockReason(null, MUTATION[0])).toBeNull();
    expect(getRunBlockReason(undefined, MUTATION[0])).toBeNull();
  });

  it('does not block when there is no active operation', () => {
    expect(getRunBlockReason('GET')).toBeNull();
  });
});
