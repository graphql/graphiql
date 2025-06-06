/**
 * This example commands.ts shows you how to create various custom commands and
 * overwrite existing commands.
 *
 * For more comprehensive examples of custom commands, please read more here:
 * https://on.cypress.io/custom-commands
 */

/// <reference types="cypress" />

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

  interface Chainable {
    /**
     * Custom command to select a DOM element by `data-cy` attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;

    clickExecuteQuery(): Chainable<Element>;

    visitWithOp(op: Op): Chainable<Element>;

    clickPrettify(): Chainable<Element>;

    assertHasValues(op: Op): Chainable<Element>;

    assertQueryResult(expectedResult: MockResult): Chainable<Element>;

    containQueryResult(expectedResult: string): Chainable<Element>;

    assertLinterMarkWithMessage(
      text: string,
      severity: 'error' | 'warning',
      message: string,
      uri?: 'query.graphql' | 'variable.json',
    ): Chainable<Element>;
  }
}

// @ts-expect-error -- fixme
Cypress.Commands.add('dataCy', value => {
  return cy.get(`[data-cy="${value}"]`);
});

// @ts-expect-error -- fixme
Cypress.Commands.add('clickExecuteQuery', () => {
  return cy.get('.graphiql-execute-button').click();
});

// @ts-expect-error -- fixme
Cypress.Commands.add('clickPrettify', () => {
  return cy.get('[aria-label="Prettify query (Shift-Ctrl-P)"]').click();
});

// @ts-expect-error -- fixme
Cypress.Commands.add('visitWithOp', ({ query, variables, variablesString }) => {
  let url = `/?query=${encodeURIComponent(query)}`;
  if (variables || variablesString) {
    url += `&variables=${encodeURIComponent(
      // @ts-expect-error -- fixme
      JSON.stringify(variables, null, 2) || variablesString,
    )}`;
  }
  return cy.visit(url);
});

Cypress.Commands.add(
  'assertHasValues',
  ({ query, variables, variablesString, headersString, response }: Op) => {
    cy.get(
      '.graphiql-query-editor .view-lines.monaco-mouse-cursor-text',
    ).should(element => {
      const actual = normalizeMonacoWhitespace(element.get(0).innerText);
      const expected = query;
      expect(actual).to.equal(expected);
    });
    if (variables !== undefined) {
      cy.contains('Variables').click();
      cy.get(
        '.graphiql-editor-tool .graphiql-editor .view-lines.monaco-mouse-cursor-text',
      )
        .eq(0)
        .should(element => {
          const actual = normalizeMonacoWhitespace(element.get(0).innerText);
          const expected = JSON.stringify(variables, null, 2);
          expect(actual).to.equal(expected);
        });
    }
    if (variablesString !== undefined) {
      cy.contains('Variables').click();
      cy.get(
        '.graphiql-editor-tool .graphiql-editor .view-lines.monaco-mouse-cursor-text',
      )
        .eq(0)
        .should(element => {
          const actual = normalizeMonacoWhitespace(element.get(0).innerText);
          const expected = variablesString;
          expect(actual).to.equal(expected);
        });
    }
    if (headersString !== undefined) {
      cy.contains('Headers').click();
      cy.get(
        '.graphiql-editor-tool .graphiql-editor .view-lines.monaco-mouse-cursor-text',
      )
        .eq(1)
        .should(element => {
          const actual = normalizeMonacoWhitespace(element.get(0).innerText);
          const expected = headersString;
          expect(actual).to.equal(expected);
        });
    }
    if (response !== undefined) {
      cy.get('.result-window').should(element => {
        const actual = normalizeWhitespace(element.get(0).innerText);
        const expected = JSON.stringify(response, null, 2);
        expect(actual).to.equal(expected);
      });
    }
  },
);

Cypress.Commands.add('assertQueryResult', expectedResult => {
  cy.get('section.result-window').should(element => {
    const actual = normalizeWhitespace(element.get(0).innerText);
    const expected = JSON.stringify(expectedResult, null, 2);
    expect(actual).to.equal(expected);
  });
});

// Monaco editor adds non-breaking spaces for all spaces, we need to normalize them
function normalizeMonacoWhitespace(str: string): string {
  return str.replaceAll(' ', ' ');
}

Cypress.Commands.add('containQueryResult', expected => {
  cy.get('section.result-window').should(element => {
    // TODO monaco check if we need it
    const actual = normalizeMonacoWhitespace(element.get(0).textContent!);
    expect(actual).to.contain(expected);
  });
});

function normalizeWhitespace(str: string): string {
  return str.replaceAll('\xA0', ' ');
}

Cypress.Commands.add(
  'assertLinterMarkWithMessage',
  (text, severity, message, uri = 'query.graphql') => {
    // Ensure error is visible in the DOM
    cy.get(`.squiggly-${severity}`, { timeout: 10_000 });
    cy.window().then(win => {
      const { editor, Uri, MarkerSeverity } = win.__MONACO;
      const markers = editor.getModelMarkers({
        resource: Uri.parse(uri),
      });
      // Only "Property is not allowed." isn't added in model markers
      if (!message.endsWith(' is not allowed.')) {
        expect(markers.length).to.be.greaterThan(0);
        expect(markers[0].message).eq(message);
        const markerSeverity = {
          error: MarkerSeverity.Error,
          warning: MarkerSeverity.Warning,
        }[severity];
        expect(markers[0].severity).eq(markerSeverity);
      }
      cy.contains(text).trigger('mousemove', {
        // Hover in the right corner, because some errors like `Expected comma or closing brace` are
        // highlighted at the end
        position: 'bottomRight',
        timeout: 6_000,
      });
      cy.contains(message);
    });
  },
);
