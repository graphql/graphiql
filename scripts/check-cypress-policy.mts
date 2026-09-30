import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type CypressPolicy =
  | 'direct-monaco'
  | 'numeric-wait'
  | 'positional-activity-rail'
  | 'rendered-monaco-line';

export interface CypressPolicyViolation {
  column: number;
  file: string;
  line: number;
  message: string;
  policy: CypressPolicy;
}

interface PolicyRule {
  message: string;
  pattern: RegExp;
  policy: CypressPolicy;
}

const RULES: readonly PolicyRule[] = [
  {
    policy: 'numeric-wait',
    pattern: /\bcy\.wait\(\s*\d[\d_]*(?:\.\d+)?\s*\)/g,
    message:
      'Wait for an observable state change or request alias instead of elapsed time.',
  },
  {
    policy: 'rendered-monaco-line',
    pattern:
      /\bcy\.(?:contains|get)\(\s*(['"`])(?:(?!\1)[\s\S])*?\.view-lines?(?:\b|[.\s:#[\]])/g,
    message:
      'Use a Monaco model helper; rendered .view-line(s) elements are not a readiness boundary.',
  },
  {
    policy: 'positional-activity-rail',
    pattern:
      /\bcy\.get\(\s*(['"`])(?:(?!\1)[\s\S])*?\.graphiql-activity-rail-item(?:(?!\1)[\s\S])*?\1\s*\)\s*\.eq\(\s*\d+\s*\)/g,
    message:
      'Select activity-rail items by accessible name or another semantic identity.',
  },
  {
    policy: 'direct-monaco',
    pattern: /(?:\.\s*__MONACO\b|\[\s*['"]__MONACO['"]\s*\])/g,
    message:
      'Use the shared Monaco helpers instead of reading __MONACO directly.',
  },
];

const SPEC_EXEMPTIONS: Readonly<
  Partial<Record<CypressPolicy, ReadonlySet<string>>>
> = {
  // These tests specifically exercise Monaco's worker/provider integration.
  'direct-monaco': new Set([
    'e2e/monaco-worker.cy.ts',
    // This regression test must move the cursor and execute in the same event turn.
    'e2e/operation-cursor.cy.ts',
  ]),
  // Accessibility/focus/race tests need Monaco's rendered surface to exist.
  'rendered-monaco-line': new Set([
    'e2e/a11y.cy.ts',
    'e2e/keyboard.cy.ts',
    'e2e/operation-cursor.cy.ts',
  ]),
};

const CYPRESS_DIRECTORY = 'packages/graphiql-e2e/cypress';

function toPosixPath(path: string) {
  return path.split(sep).join('/');
}

function isExempt(file: string, policy: CypressPolicy) {
  const cypressRelativePath = file.startsWith(`${CYPRESS_DIRECTORY}/`)
    ? file.slice(CYPRESS_DIRECTORY.length + 1)
    : file;

  if (
    cypressRelativePath.startsWith('support/') &&
    (policy === 'direct-monaco' || policy === 'rendered-monaco-line')
  ) {
    return true;
  }

  if (SPEC_EXEMPTIONS[policy]?.has(cypressRelativePath)) {
    return true;
  }

  return false;
}

function getLocation(source: string, offset: number) {
  const beforeMatch = source.slice(0, offset);
  const lineStart = beforeMatch.lastIndexOf('\n') + 1;
  return {
    column: offset - lineStart + 1,
    line: beforeMatch.split('\n').length,
  };
}

export function checkCypressSource(
  source: string,
  file: string,
): CypressPolicyViolation[] {
  const violations: CypressPolicyViolation[] = [];

  for (const rule of RULES) {
    for (const match of source.matchAll(rule.pattern)) {
      if (isExempt(file, rule.policy)) {
        continue;
      }
      const location = getLocation(source, match.index);
      violations.push({
        ...location,
        file,
        message: rule.message,
        policy: rule.policy,
      });
    }
  }

  return violations.sort(
    (left, right) => left.line - right.line || left.column - right.column,
  );
}

async function findTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(entry => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        return findTypeScriptFiles(path);
      }
      return Promise.resolve(entry.name.endsWith('.ts') ? [path] : []);
    }),
  );
  return files.flat();
}

export async function checkCypressPolicy(
  repositoryRoot: string,
): Promise<CypressPolicyViolation[]> {
  const cypressDirectory = resolve(repositoryRoot, CYPRESS_DIRECTORY);
  const files = await findTypeScriptFiles(cypressDirectory);
  const violations = await Promise.all(
    files.map(async file => {
      const repositoryRelativePath = toPosixPath(
        relative(repositoryRoot, file),
      );
      return checkCypressSource(
        await readFile(file, 'utf8'),
        repositoryRelativePath,
      );
    }),
  );
  return violations
    .flat()
    .sort((left, right) => left.file.localeCompare(right.file));
}

async function main() {
  const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const violations = await checkCypressPolicy(repositoryRoot);
  if (violations.length === 0) {
    return;
  }

  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} [${violation.policy}] ${violation.message}`,
    );
  }
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
