/**
 * This example commands.ts shows you how to create various custom commands and
 * overwrite existing commands.
 *
 * For more comprehensive examples of custom commands, please read more here:
 * https://on.cypress.io/custom-commands
 */

/// <reference types="cypress" />

interface Op {
  query: string;
  variables?: Record<string, any>;
  variablesString?: string;
  headersString?: string;
  response?: Record<string, any>;
}

declare namespace Cypress {
  type MockResult =
    | { data: any }
    | { data: any; hasNext?: boolean }
    | { error: any[] }
    | { errors: any[] };

  type EditorName = 'query' | 'variables' | 'headers';

  interface Chainable {
    /**
     * Custom command to select a DOM element by `data-cy` attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;

    /**
     * Type into one of GraphiQL's Monaco editors. The golden path for editor
     * input: Monaco's real `<textarea>` is offscreen, so a plain `.type()`
     * fails Cypress' actionability check; this forces the event and targets the
     * right editor (revealing the Variables/Headers pane first when needed).
     * @example cy.typeInEditor('query Foo { id }')
     * @example cy.typeInEditor('{"id":1', { editor: 'variables' })
     */
    typeInEditor(
      text: string,
      options?: { editor?: EditorName } & Partial<Cypress.TypeOptions>,
    ): Chainable<Element>;

    /**
     * Move the query editor's cursor to a 1-indexed line via the keyboard. See
     * {@link activateOperation} for why keyboard navigation rather than clicking
     * a `.view-line` is the golden path.
     */
    setCursorToLine(line: number): Chainable<Element>;

    /**
     * Place the cursor inside a named operation so the active operation follows
     * it (Run button, operation dropdown, operation-aware plugins). The golden
     * path for cursor positioning: it finds the operation's line from the
     * `?query=` URL (deterministic) and navigates there by keyboard. Clicking a
     * `.view-line` instead races Monaco's layout repaints and flakes in headless
     * runs, and a programmatic `setPosition` is ignored because tracking only
     * follows `Explicit` (user-driven) cursor changes.
     * @example cy.activateOperation('MyMutation')
     */
    activateOperation(operationName: string): Chainable<Element>;

    clickExecuteQuery(): Chainable<Element>;

    visitWithOp(op: Op): Chainable<Element>;

    clickPrettify(): Chainable<Element>;

    clickMergeFragments(): Chainable<Element>;

    assertHasValues(op: Op): Chainable<Element>;

    assertQueryResult(expectedResult: MockResult): Chainable<Element>;

    containQueryResult(expectedResult: string): Chainable<Element>;

    assertLinterMarkWithMessage(
      text: string,
      severity: 'error' | 'warning',
      message: string,
      uri?: 'operation.graphql' | 'variables.json',
    ): Chainable<Element>;
  }
}

Cypress.Commands.add('dataCy', value => {
  cy.get(`[data-cy="${value}"]`);
});

const QUERY_EDITOR_TEXTAREA = '.graphiql-query-editor textarea';

Cypress.Commands.add('typeInEditor', (text, options = {}) => {
  const { editor = 'query', ...typeOptions } = options;
  if (editor === 'query') {
    cy.get(QUERY_EDITOR_TEXTAREA).type(text, { force: true, ...typeOptions });
    return;
  }
  // The Variables and Headers editors live in the bottom tool pane; reveal the
  // requested one, then target it (Variables is index 0, Headers index 1).
  const index = editor === 'variables' ? 0 : 1;
  cy.contains(editor === 'variables' ? 'Variables' : 'Headers').click();
  cy.get('.graphiql-editor-tool textarea')
    .eq(index)
    .type(text, { force: true, ...typeOptions });
});

Cypress.Commands.add('setCursorToLine', (line: number) => {
  // `{upArrow}` past the top clamps at line 1, then step down to the target;
  // `{home}` pins the column so the resulting offset is unambiguous. Keyboard
  // moves are `Explicit` cursor changes and the offscreen `<textarea>` is stable
  // across Monaco's layout repaints, unlike the `.view-line` DOM.
  const toTop = '{upArrow}'.repeat(100);
  const down = '{downArrow}'.repeat(Math.max(0, line - 1));
  cy.get(QUERY_EDITOR_TEXTAREA).type(`${toTop}${down}{home}`, {
    force: true,
    delay: 0,
  });
});

const OPERATION_KEYWORDS = 'query|mutation|subscription';

Cypress.Commands.add('activateOperation', (operationName: string) => {
  cy.location('search').then(search => {
    const match = /[?&]query=([^&]*)/.exec(search);
    const query = match ? decodeURIComponent(match[1]) : '';
    const lineIndex = query
      .split('\n')
      .findIndex(line =>
        new RegExp(`\\b(?:${OPERATION_KEYWORDS})\\s+${operationName}\\b`).test(
          line,
        ),
      );
    expect(
      lineIndex,
      `operation "${operationName}" should appear in the ?query= document`,
    ).to.be.gte(0);
    cy.setCursorToLine(lineIndex + 1);
  });
});

Cypress.Commands.add('clickExecuteQuery', () => {
  cy.get('.graphiql-execute-button').click();
});

Cypress.Commands.add('clickPrettify', () => {
  cy.get('[aria-label="Prettify query"]').click();
});

Cypress.Commands.add('clickMergeFragments', () => {
  cy.get('[aria-label="Merge fragments into query"]').click();
});

Cypress.Commands.add('visitWithOp', ({ query, variables, variablesString }) => {
  let url = `?query=${encodeURIComponent(query)}`;
  if (variables || variablesString) {
    url += `&variables=${encodeURIComponent(
      JSON.stringify(variables, null, 2) || variablesString,
    )}`;
  }
  cy.visit(url);
});

Cypress.Commands.add(
  'assertHasValues',
  ({ query, variables, variablesString, headersString, response }: Op) => {
    cy.get(
      '.graphiql-query-editor .view-lines.monaco-mouse-cursor-text',
    ).should(element => {
      const actual = normalizeMonacoWhitespace(element.get(0).innerText); // should be innerText
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
          const actual = normalizeMonacoWhitespace(element.get(0).textContent);
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
          const actual = normalizeMonacoWhitespace(element.get(0).innerText); // should be innerText
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
          const actual = normalizeMonacoWhitespace(element.get(0).textContent);
          const expected = headersString;
          expect(actual).to.equal(expected);
        });
    }
    if (response !== undefined) {
      cy.get('.result-window').should(element => {
        const actual = normalizeMonacoWhitespace(element.get(0).innerText); // should be innerText
        const expected = JSON.stringify(response, null, 2);
        expect(actual).to.equal(expected);
      });
    }
  },
);

Cypress.Commands.add('assertQueryResult', expectedResult => {
  cy.get('section.result-window').should(element => {
    const actual = normalizeMonacoWhitespace(element.get(0).innerText); // should be innerText
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
    const actual = normalizeMonacoWhitespace(element.get(0).textContent);
    expect(actual).to.contain(expected);
  });
});

Cypress.Commands.add(
  'assertLinterMarkWithMessage',
  (text, severity, message, uri = 'operation.graphql') => {
    // Ensure error is visible in the DOM
    cy.get(`.squiggly-${severity}`, { timeout: 10_000 });
    cy.window().then(win => {
      const { editor, MarkerSeverity } = win.__MONACO;
      const models = editor.getModels();
      const model = models.find(m => m.uri.path.endsWith(uri))!;
      const markers = editor.getModelMarkers({
        resource: model.uri,
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
    });
    // Monaco computes the hover tooltip from a single `mousemove`. When that
    // event fires before the hover provider has picked up the latest markers,
    // the tooltip never renders and no further event re-asks for it. Re-trigger
    // until the message shows so the assertion stops racing the tooltip.
    assertHoverShowsMessage(text, message);
  },
);

function assertHoverShowsMessage(text: string, message: string, attempt = 0) {
  cy.contains(text).trigger('mousemove', {
    // Hover in the right corner, because some errors like `Expected comma or closing brace` are
    // highlighted at the end
    position: 'bottomRight',
    force: true, // otherwise popup doesn't show
  });
  if (attempt >= 10) {
    cy.contains(message); // out of retries: assert directly so failures report clearly
    return;
  }
  cy.get('body').then($body => {
    if ($body.text().includes(message)) {
      cy.contains(message);
    } else {
      cy.wait(300);
      assertHoverShowsMessage(text, message, attempt + 1);
    }
  });
}
