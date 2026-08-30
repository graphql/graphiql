/// <reference types="cypress" />
/// <reference types="cypress-axe" />

import baseline from '../.a11y-baseline.json';

type ViolationSummary = {
  id: string;
  impact: string | null;
  nodeCount: number;
};

type Baseline = Record<string, ViolationSummary[]>;

const UPDATE_BASELINE = Boolean(Cypress.env('A11Y_UPDATE_BASELINE'));

const RULESET = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

const accumulated: Baseline = {};

function toSummary(v: {
  id: string;
  impact?: string | null;
  nodes: unknown[];
}): ViolationSummary {
  return { id: v.id, impact: v.impact ?? null, nodeCount: v.nodes.length };
}

function checkOrCapture(checkpoint: string) {
  cy.checkA11y(
    undefined,
    RULESET,
    violations => {
      if (UPDATE_BASELINE) {
        accumulated[checkpoint] = violations.map(toSummary);
        // Task runs in Node; path is relative to the package root.
        // cypress.config.ts wires up the writeBaseline task.
        cy.task('writeBaseline', {
          filePath: 'cypress/.a11y-baseline.json',
          data: { ...(baseline as Baseline), ...accumulated },
        });
      } else {
        const baselineEntries: ViolationSummary[] =
          (baseline as Baseline)[checkpoint] ?? [];
        // Compare by violation id only — node counts drift between local
        // (Electron on macOS) and CI (headless Chromium on Linux) for the
        // same underlying issues, so they're not a reliable key.
        const baselineKeys = new Set(baselineEntries.map(v => v.id));
        const newViolations = violations.filter(v => !baselineKeys.has(v.id));
        if (newViolations.length > 0) {
          const summary = newViolations
            .map(v => `${v.id} (${v.impact}): ${v.help}`)
            .join('\n');
          throw new Error(
            `New a11y violations at "${checkpoint}":\n${summary}`,
          );
        }
      }
    },
    // Don't let cypress-axe auto-throw — the callback above is the only
    // source of failures (compare-against-baseline in normal mode; capture
    // and write in update mode).
    true,
  );
}

describe('a11y baseline', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('initial render has no new violations', () => {
    checkOrCapture('initial');
  });

  it('after running a query has no new violations', () => {
    cy.clickExecuteQuery();
    // Wait for the response panel to populate before scanning
    cy.get('section.result-window').should('not.have.text', '');
    cy.injectAxe();
    checkOrCapture('post-run');
  });

  it('with docs panel open has no new violations', () => {
    // First sidebar button is the docs explorer toggle (confirmed in docs.cy.ts)
    cy.get('.graphiql-activity-rail-item').eq(0).click();
    cy.get('.graphiql-doc-explorer').should('be.visible');
    cy.injectAxe();
    checkOrCapture('docs-open');
  });

  it('with history panel open has no new violations', () => {
    // history.cy.ts uses this exact selector
    cy.get('button[aria-label="Show History"]').click();
    cy.get('.graphiql-history').should('be.visible');
    cy.injectAxe();
    checkOrCapture('history-open');
  });
});
