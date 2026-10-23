import { describe, it, expect } from 'vitest';
import { parse, OperationDefinitionNode } from 'graphql';
import { resolveActiveOperation } from './active-operation';

function opsOf(source: string): OperationDefinitionNode[] {
  return parse(source).definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition',
  );
}

const QUERY = opsOf('query Q { a }');
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
