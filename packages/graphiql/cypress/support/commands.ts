// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// / <reference types="cypress" />

type Op = {
  query: string;
  variables?: Record<string, any>;
  variablesString?: string;
  headersString?: string;
  response?: Record<string, any>;
};
declare namespace Cypress {
  type MockResult =
    | { data: any }
    | { data: any; hasNext?: boolean }
    | { error: any[] }
    | { errors: any[] };
  interface Chainable<Subject = any> {
    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;
    getCy(cyName: string): Chainable<Element>;
    clickExecuteQuery(): Chainable<Element>;
    visitWithOp(op: Op): Chainable<Element>;
    clickPrettify(): Chainable<Element>;
    assertHasValues(op: Op): Chainable<Element>;
    assertQueryResult(
      op: Op,
      expectedResult: MockResult,
      timeout?: number,
    ): Chainable<Element>;
    assertLinterMarkWithMessage(
      text: string,
      severity: 'error' | 'warning',
      message?: string,
    ): Chainable<Element>;
  }
}

Cypress.Commands.add('getCy', cyName => {
  return cy.get(`[data-cy=${cyName}]`);
});

Cypress.Commands.add('clickExecuteQuery', () => {
  return cy.get('.execute-button').click();
});

Cypress.Commands.add('clickPrettify', () => {
  return cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();
});

Cypress.Commands.add('visitWithOp', ({ query, variables, variablesString }) => {
  let url = `/?query=${encodeURIComponent(query)}`;
  if (variables || variablesString) {
    url += `&variables=${encodeURIComponent(
      JSON.stringify(variables, null, 2) || variablesString,
    )}`;
  }
  return cy.visit(url);
});

Cypress.Commands.add(
  'assertHasValues',
  ({ query, variables, variablesString, headersString, response }: Op) => {
    cy.get('.query-editor').should(element => {
      expect(normalize(element.get(0).innerText)).to.equal(
        codeWithLineNumbers(query),
      );
    });
    if (typeof variables !== 'undefined') {
      cy.contains('Query Variables').click();
      cy.get('.variable-editor .codemirrorWrap')
        .eq(0)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(JSON.stringify(variables, null, 2)),
          );
        });
    }
    if (typeof variablesString !== 'undefined') {
      cy.contains('Query Variables').click();
      cy.get('.variable-editor .codemirrorWrap')
        .eq(0)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(variablesString),
          );
        });
    }
    if (typeof headersString !== 'undefined') {
      cy.contains('Request Headers').click();
      cy.get('.variable-editor .codemirrorWrap')
        .eq(1)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(headersString),
          );
        });
    }
    if (typeof response !== 'undefined') {
      cy.get('.result-window').should(element => {
        expect(normalizeWhitespace(element.get(0).innerText)).to.equal(
          JSON.stringify(response, null, 2),
        );
      });
    }
  },
);

Cypress.Commands.add('assertQueryResult', (op, mockSuccess, timeout = 200) => {
  cy.visitWithOp(op);
  cy.clickExecuteQuery();
  cy.wait(timeout);
  cy.get('section.result-window').should(element => {
    expect(normalizeWhitespace(element.get(0).innerText)).to.equal(
      JSON.stringify(mockSuccess, null, 2),
    );
  });
});

function codeWithLineNumbers(code: string): string {
  return code
    .split('\n')
    .map((line, i) => `${i + 1}\n${line}`)
    .join('\n');
}

function normalize(str: string) {
  return str.replace(/\u200b/g, '');
}

function normalizeWhitespace(str: string) {
  return str.replace(/\u00a0/g, ' ');
}

Cypress.Commands.add(
  'assertLinterMarkWithMessage',
  (text, severity, message) => {
    cy.contains(text)
      .should('have.class', 'CodeMirror-lint-mark')
      .and('have.class', `CodeMirror-lint-mark-${severity}`);
    if (message) {
      cy.contains(text).trigger('mouseover');
      cy.contains(message);
    }
  },
);
