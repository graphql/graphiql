import { describe, expect, it } from 'vitest';
import { getDocumentMethod } from './operation-method';

describe('getDocumentMethod', () => {
  it('returns the single operation type', () => {
    expect(getDocumentMethod('query GetUser { user { id } }')).toBe('query');
    expect(getDocumentMethod('mutation AddUser { addUser { id } }')).toBe(
      'mutation',
    );
    expect(getDocumentMethod('subscription OnUser { user { id } }')).toBe(
      'subscription',
    );
  });

  it('returns "mix" for a document with multiple operations', () => {
    expect(
      getDocumentMethod('query A { __typename }\nmutation B { __typename }'),
    ).toBe('mix');
    expect(
      getDocumentMethod('query A { __typename }\nquery B { __typename }'),
    ).toBe('mix');
  });

  it('treats anonymous shorthand as a query', () => {
    expect(getDocumentMethod('{ __typename }')).toBe('query');
  });

  it('ignores fragments when counting operations', () => {
    const doc = `
      fragment UserFields on User { id }
      query GetUser { user { ...UserFields } }
    `;
    expect(getDocumentMethod(doc)).toBe('query');
  });

  it('falls back to a regex guess for unparseable input', () => {
    expect(getDocumentMethod('mutation Broken { ')).toBe('mutation');
    expect(getDocumentMethod('not even graphql')).toBe('query');
  });
});
