import { parse } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import { describe, expect, it } from 'vitest';
import { getOperationNameAtCursor } from './operation-editor';

// A minimal fake Monaco editor that reports a fixed cursor offset.
function makeEditor(offset: number | null) {
  return {
    getPosition: () => (offset === null ? null : { lineNumber: 1, column: 1 }),
    getModel: () => ({ getOffsetAt: () => offset ?? 0 }),
  } as any;
}

// Real loc ranges from the parser rather than hand-rolled offsets.
const DOC = `query GetUser {
  user {
    id
  }
}

query GetPost {
  post {
    title
  }
}

{
  viewer {
    name
  }
}
`;

const operations = parse(DOC).definitions as OperationDefinitionNode[];
const [getUser, getPost, anon] = operations;
const mid = (op: OperationDefinitionNode) =>
  Math.floor((op.loc!.start + op.loc!.end) / 2);

describe('getOperationNameAtCursor', () => {
  it('returns the name of the operation containing the cursor', () => {
    expect(
      getOperationNameAtCursor(makeEditor(mid(getUser!)), operations),
    ).toBe('GetUser');
  });

  it('follows the cursor into a later named operation', () => {
    expect(
      getOperationNameAtCursor(makeEditor(mid(getPost!)), operations),
    ).toBe('GetPost');
  });

  it('returns undefined in the whitespace between operations', () => {
    expect(
      getOperationNameAtCursor(makeEditor(getUser!.loc!.end + 1), operations),
    ).toBeUndefined();
  });

  it('returns undefined inside an anonymous operation', () => {
    expect(
      getOperationNameAtCursor(makeEditor(mid(anon!)), operations),
    ).toBeUndefined();
  });

  it('returns undefined when there is no cursor position', () => {
    expect(
      getOperationNameAtCursor(makeEditor(null), operations),
    ).toBeUndefined();
  });

  it('treats the operation boundaries as inclusive', () => {
    expect(
      getOperationNameAtCursor(makeEditor(getUser!.loc!.start), operations),
    ).toBe('GetUser');
    expect(
      getOperationNameAtCursor(makeEditor(getUser!.loc!.end), operations),
    ).toBe('GetUser');
  });
});
