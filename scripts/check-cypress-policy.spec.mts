import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkCypressPolicy,
  checkCypressSource,
  type CypressPolicy,
} from './check-cypress-policy.mts';

function policies(
  source: string,
  file = 'packages/graphiql-e2e/cypress/e2e/example.cy.ts',
) {
  return checkCypressSource(source, file).map(violation => violation.policy);
}

test('rejects Cypress patterns that have caused flakes', () => {
  const source = `
cy.wait(300);
cy.get('.graphiql-query-editor .view-lines').click();
cy.get('.graphiql-activity-rail-item').eq(0).click();
cy.window().then(win => win.__MONACO.editor.getModels());
`;

  assert.deepEqual(policies(source), [
    'numeric-wait',
    'rendered-monaco-line',
    'positional-activity-rail',
    'direct-monaco',
  ] satisfies CypressPolicy[]);
});

test('allows request aliases, semantic selectors, and shared helpers', () => {
  const source = `
cy.wait('@executeQuery');
cy.findByRole('button', { name: 'Show Documentation Explorer' }).click();
cy.setEditorValue('query', '{ viewer { id } }');
`;

  assert.deepEqual(policies(source), []);
});

test('keeps direct Monaco access inside support and worker tests', () => {
  const source = `
cy.get('.view-lines').click();
cy.window().then(win => win.__MONACO.editor.getModels());
`;

  assert.deepEqual(
    policies(source, 'packages/graphiql-e2e/cypress/support/commands.ts'),
    [],
  );
  assert.deepEqual(
    policies(source, 'packages/graphiql-e2e/cypress/e2e/monaco-worker.cy.ts'),
    ['rendered-monaco-line'],
  );
});

test('the Cypress suite satisfies the flake-prevention policy', async () => {
  const repositoryRoot = new URL('..', import.meta.url).pathname;
  assert.deepEqual(await checkCypressPolicy(repositoryRoot), []);
});
