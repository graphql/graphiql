import * as fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import * as oniguruma from 'vscode-oniguruma';
import * as tm from 'vscode-textmate';
import { expect } from 'vitest';

const ROOT = path.join(__dirname, '..');

type Token = {
  text: string;
  scopes: string[];
};

export async function tokenizeFile(
  file: string,
  grammarScopeName: string,
): Promise<Token[]> {
  const grammar = await getGrammar(grammarScopeName);
  const lines = (await readFile(path.join(__dirname, file), 'utf8')).split(
    '\n',
  );

  const tokens: Token[] = [];

  let ruleStack = tm.INITIAL;
  for (const line of lines) {
    const result = grammar.tokenizeLine(line, ruleStack);

    for (const token of result.tokens) {
      tokens.push({
        text: line.slice(token.startIndex, token.endIndex),
        scopes: token.scopes.filter(scope => scope !== grammarScopeName),
      });
    }

    ruleStack = result.ruleStack;
  }

  return tokens;
}

const grammarCache: Record<string, tm.IGrammar> = Object.create(null);

async function getGrammar(scopeName: string) {
  if (grammarCache[scopeName]) {
    return grammarCache[scopeName];
  }

  const grammars = (await loadConfiguration()).map(grammar => {
    return {
      grammar,
      content: fs.readFileSync(grammar.path, 'utf8'),
    };
  });

  const grammarMap: { [key: string]: tm.IRawGrammar } = Object.create(null);
  const injections: { [scopeName: string]: string[] } = Object.create(null);

  for (const { grammar, content } of grammars) {
    const rawGrammar = tm.parseRawGrammar(content, grammar.path);
    grammarMap[grammar.scopeName || rawGrammar.scopeName] = rawGrammar;

    if (grammar.injectTo) {
      for (const injectScope of grammar.injectTo) {
        (injections[injectScope] ||= []).push(grammar.scopeName);
      }
    }
  }

  const registry = new tm.Registry({
    onigLib: vscodeOnigurumaLib(),
    loadGrammar: async scope => grammarMap[scope],
    getInjections: scope =>
      scope
        .split('.')
        .flatMap(
          (_, i, parts) => injections[parts.slice(0, i + 1).join('.')] || [],
        ),
  } as tm.RegistryOptions);

  const grammar = await registry.loadGrammar(scopeName);

  if (!grammar) {
    throw new Error(`Unknown grammar: ${scopeName}`);
  }

  grammarCache[scopeName] = grammar;
  return grammar;
}

async function vscodeOnigurumaLib() {
  const wasmPath = path.join(
    path.dirname(require.resolve('vscode-oniguruma')),
    'onig.wasm',
  );

  await oniguruma.loadWASM((await readFile(wasmPath)).buffer);

  return {
    createOnigScanner(patterns: any) {
      return new oniguruma.OnigScanner(patterns);
    },
    createOnigString(s: any) {
      return new oniguruma.OnigString(s);
    },
  };
}

async function loadConfiguration() {
  const json = JSON.parse(
    await readFile(path.join(ROOT, 'package.json'), 'utf8'),
  );

  return (json?.contributes?.grammars || []).map(grammar => ({
    ...grammar,
    path: path.join(ROOT, grammar.path),
  }));
}

function formatTokens(tokens: Token[]): string {
  const maxLength = Math.max(...tokens.map(token => token.text.length));

  return tokens
    .map(token => {
      return `${token.text.padEnd(maxLength)} | ${token.scopes.join(' ')}`;
    })
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
