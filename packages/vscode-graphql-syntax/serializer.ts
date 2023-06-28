import { Token } from './tests/utilities';

function formatTokens(tokens: Token[]): string {
  const maxLength = Math.max(...tokens.map(token => token.text.length));

  return tokens
    .map(token => `${token.text.padEnd(maxLength)} | ${token.scopes.join(' ')}`)
    .join('\n');
}

expect.addSnapshotSerializer({
  test: value =>
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'object' &&
        typeof item.text === 'string' &&
        Array.isArray(item.scopes),
    ),
  serialize: value => formatTokens(value as Token[]),
});
