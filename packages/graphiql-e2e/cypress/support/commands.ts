/**
 * This example commands.ts shows you how to create various custom commands and
 * overwrite existing commands.
 *
 * For more comprehensive examples of custom commands, please read more here:
 * https://on.cypress.io/custom-commands
 */

/// <reference types="cypress" />

import type * as monaco from 'monaco-editor';
import type { Params } from '../../src/params.js';

interface Op {
  query: string;
  variables?: Record<string, any>;
  variablesString?: string;
  headersString?: string;
  response?: Record<string, any>;
}

type VisitParams = Params<string | Record<string, unknown>>;

declare global {
  namespace Cypress {
    type MockResult =
      | { data: any }
      | { data: any; hasNext?: boolean }
      | { error: any[] }
      | { errors: any[] };

    type EditorName = 'query' | 'variables' | 'headers';
    type PluginName = 'Documentation Explorer' | 'History';

    interface Chainable {
      /**
       * Custom command to select a DOM element by `data-cy` attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<Element>;

      /** Open a plugin by its accessible name and wait for its panel. */
      showPlugin(name: PluginName): Chainable<Element>;

      /** Close a plugin by its accessible name and wait for its panel to leave. */
      hidePlugin(name: PluginName): Chainable<Element>;

      /**
       * Type into one of GraphiQL's Monaco editors with trusted keyboard events.
       * Use this only when the behavior under test depends on typing. For test
       * setup, prefer `setEditorValue`, which does not depend on focus or paint.
       * @example cy.typeInEditor('query Foo { id }')
       * @example cy.typeInEditor('{"id":1', { editor: 'variables' })
       */
      typeInEditor(
        text: string,
        options?: { editor?: EditorName; delay?: number },
      ): Chainable<void>;

      /** Get the model belonging to the currently attached GraphiQL editor. */
      getEditorModel(editor?: EditorName): Chainable<monaco.editor.ITextModel>;

      /** Set editor contents directly. Prefer this for test setup. */
      setEditorValue(value: string, editor?: EditorName): Chainable<void>;

      /** Retry until the attached editor model has the expected contents. */
      assertEditorValue(
        expected: string,
        editor?: EditorName,
      ): Chainable<monaco.editor.ITextModel>;

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

      visitGraphiQL(
        params?: VisitParams,
        visitOptions?: Partial<VisitOptions>,
      ): Chainable<AUTWindow>;

      clickPrettify(): Chainable<Element>;

      clickMergeFragments(): Chainable<Element>;

      waitForQueryEditor(expectedValue?: string): Chainable<AUTWindow>;

      assertHasValues(op: Op): Chainable<Element>;

      assertQueryResult(
        expectedResult: MockResult,
        options?: { timeout: number },
      ): Chainable<Element>;

      containQueryResult(expectedResult: string): Chainable<Element>;

      assertLinterMarkWithMessage(
        text: string,
        severity: 'error' | 'warning',
        message: string,
        uri?: 'operation.graphql' | 'variables.json',
      ): Chainable<Element>;

      /** Replace known-invalid input and retry until its markers clear. */
      clearLinterMarksWithValue(
        value: string,
        uri?: 'operation.graphql' | 'variables.json',
      ): Chainable<Element>;
    }
  }
}

Cypress.Commands.add('dataCy', value => {
  cy.get(`[data-cy="${value}"]`);
});

Cypress.Commands.add('showPlugin', name => {
  cy.get(`button[aria-label="Show ${name}"]`).click();
  return cy.get(`[aria-label="${name}"]`).should('be.visible');
});

Cypress.Commands.add('hidePlugin', name => {
  cy.get(`button[aria-label="Hide ${name}"]`).click();
  return cy.get(`[aria-label="${name}"]`).should('not.exist');
});

Cypress.Commands.add('typeInEditor', (text, options = {}) => {
  const { editor = 'query', delay = 0 } = options;
  if (editor === 'query') {
    cy.get('.graphiql-query-editor .view-lines').realClick();
    realTypeInFocusedEditor(text, delay);
    return;
  }
  // The Variables and Headers editors live in the bottom tool pane; reveal the
  // requested one, then target it (Variables is index 0, Headers index 1).
  const index = editor === 'variables' ? 0 : 1;
  cy.contains(editor === 'variables' ? 'Variables' : 'Headers').click();
  cy.get('.graphiql-editor-tool .view-lines').eq(index).realClick();
  realTypeInFocusedEditor(text, delay);
});

const EDITOR_MODEL_FILES: Record<Cypress.EditorName, string> = {
  query: 'operation.graphql',
  variables: 'variables.json',
  headers: 'request-headers.json',
};

function findAttachedEditorModel(
  win: Cypress.AUTWindow,
  editorName: Cypress.EditorName,
) {
  const modelFile = EDITOR_MODEL_FILES[editorName];
  const editor = win.__MONACO?.editor.getEditors().find(candidate => {
    const domNode = candidate.getDomNode();
    return (
      domNode?.isConnected && candidate.getModel()?.uri.path.endsWith(modelFile)
    );
  });
  return editor?.getModel() ?? undefined;
}

function waitForEditorEffects(win: Cypress.AUTWindow) {
  return new Cypress.Promise<void>(resolve => {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => resolve());
    });
  });
}

function afterEditorEffects<T>(win: Cypress.AUTWindow, value: T) {
  return waitForEditorEffects(win).then(() => value);
}

Cypress.Commands.add('getEditorModel', (editor = 'query') =>
  cy
    .window()
    .should(win => {
      expect(
        findAttachedEditorModel(win, editor),
        `${editor} editor model`,
      ).not.to.equal(undefined);
    })
    // Monaco attaches its editor in one React effect. Consumers subscribe to
    // that editor after the resulting render, so cross the paint boundary
    // before allowing tests to mutate the model.
    .then(win =>
      afterEditorEffects(win, findAttachedEditorModel(win, editor)!),
    ),
);

Cypress.Commands.add('setEditorValue', (value, editor = 'query') =>
  cy
    .getEditorModel(editor)
    .then(model => {
      model.setValue(value);
    })
    // Model changes notify React synchronously, but their rendered state (for
    // example a tab's operation name) is not observable until the next paint.
    .then(() => cy.window())
    .then(waitForEditorEffects),
);

Cypress.Commands.add('assertEditorValue', (expected, editor = 'query') =>
  cy
    .window()
    .should(win => {
      const model = findAttachedEditorModel(win, editor);
      expect(model, `${editor} editor model`).not.to.equal(undefined);
      expect(model!.getValue(), `${editor} editor value`).to.equal(expected);
    })
    .then(win => findAttachedEditorModel(win, editor)!),
);

function realTypeInFocusedEditor(text: string, delay: number) {
  if (text === '{esc}') {
    cy.focused().type('{esc}', { force: true });
    return;
  }
  for (const character of text) {
    cy.realPress(character === '\n' ? 'Enter' : character, {
      pressDelay: delay,
    });
  }
}

Cypress.Commands.add('setCursorToLine', (line: number) => {
  cy.window().then(win => {
    const model = win.__MONACO.editor
      .getModels()
      .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
    const codeEditor = win.__MONACO.editor
      .getEditors()
      .find(candidate => candidate.getModel() === model)!;
    codeEditor.setPosition({ lineNumber: 1, column: 1 });
    for (let currentLine = 1; currentLine < line; currentLine++) {
      codeEditor.trigger('keyboard', 'cursorDown', null);
    }
    codeEditor.trigger('keyboard', 'cursorHome', null);
    codeEditor.trigger('keyboard', 'cursorRight', null);
    codeEditor.trigger('keyboard', 'cursorLeft', null);
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
  cy.waitForQueryEditor();
  cy.get('[aria-label="Run operation"]').click();
});

Cypress.Commands.add('clickPrettify', () => {
  cy.waitForQueryEditor();
  cy.get('[aria-label="Prettify editors"]').click();
});

Cypress.Commands.add('clickMergeFragments', () => {
  cy.waitForQueryEditor();
  waitForSchema();
  cy.get('[aria-label="Merge fragments"]').click();
});

Cypress.Commands.add('waitForQueryEditor', expectedValue =>
  cy.window().should(win => {
    const queryModel = findAttachedEditorModel(win, 'query');
    expect(queryModel, 'query editor model').not.to.equal(undefined);
    if (expectedValue !== undefined) {
      expect(queryModel!.getValue(), 'query editor value').to.equal(
        expectedValue,
      );
    }
  }),
);

function waitForSchema() {
  return cy.get('.graphiql-status-bar-conn-connected');
}

Cypress.Commands.add('visitGraphiQL', (params = {}, visitOptions) => {
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    queryParts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}`,
    );
  }
  const url = queryParts.length === 0 ? '/' : `?${queryParts.join('&')}`;
  cy.visit(url, visitOptions);
  return cy.waitForQueryEditor(params.query ?? params.defaultQuery);
});

Cypress.Commands.add(
  'assertHasValues',
  ({ query, variables, variablesString, headersString, response }: Op) => {
    cy.assertEditorValue(query);
    // A tab switch updates Monaco immediately, then commits the query through
    // the editor's debounced change handler. Wait for that observable commit
    // so a subsequent switch cannot apply the pending update to the next tab.
    cy.window().should(win => {
      expect(win.localStorage.getItem('graphiql:query')).to.equal(query);
    });
    if (variables !== undefined) {
      cy.assertEditorValue(JSON.stringify(variables, null, 2), 'variables');
    }
    if (variablesString !== undefined) {
      cy.assertEditorValue(variablesString, 'variables');
    }
    if (headersString !== undefined) {
      cy.assertEditorValue(headersString, 'headers');
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

Cypress.Commands.add('assertQueryResult', (expectedResult, options) => {
  cy.get('section.result-window').should('not.have.text', '');
  cy.window(options).should(win => {
    const responseModel = win.__MONACO.editor
      .getModels()
      .find(model => model.uri.path.endsWith('response.json'));
    if (!responseModel) {
      throw new Error('Expected the response editor model to exist.');
    }
    expect(JSON.parse(responseModel.getValue())).to.deep.equal(expectedResult);
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
    cy.window().should(win => {
      const { editor, MarkerSeverity } = win.__MONACO;
      const models = editor.getModels();
      const model = models.find(m => m.uri.path.endsWith(uri))!;
      const markers = editor.getModelMarkers({
        resource: model.uri,
      });
      // Only "Property is not allowed." isn't added in model markers
      if (!message.endsWith(' is not allowed.')) {
        const markerSeverity = {
          error: MarkerSeverity.Error,
          warning: MarkerSeverity.Warning,
        }[severity];
        const marker = markers.find(candidate => candidate.message === message);
        expect(marker, `marker with message "${message}"`).not.to.equal(
          undefined,
        );
        expect(marker!.severity).eq(markerSeverity);
      }
    });
    assertHoverShowsMessage(text, severity, message, uri);
  },
);

function assertHoverShowsMessage(
  text: string,
  severity: 'error' | 'warning',
  message: string,
  uri: 'operation.graphql' | 'variables.json',
) {
  const editor =
    uri === 'operation.graphql'
      ? cy.get('.graphiql-query-editor .view-lines')
      : cy
          .get('.graphiql-var-headers-strip input[value="variables"]')
          .check({ force: true })
          .get('.graphiql-editor-tool .view-lines')
          .eq(0);
  const target = message.endsWith(' is not allowed.')
    ? cy.get('.graphiql-editor-tool').find(`.squiggly-${severity}`)
    : editor.contains(text);
  target.should($element => {
    const element = $element.get(0);
    const bounds = element.getBoundingClientRect();
    const MouseEvent = element.ownerDocument.defaultView!.MouseEvent;
    element.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: bounds.right - 1,
        clientY: bounds.bottom - 1,
        view: element.ownerDocument.defaultView!,
      }),
    );
    expect(element.ownerDocument.body).to.contain.text(message);
  });
}

Cypress.Commands.add(
  'clearLinterMarksWithValue',
  (value, uri = 'operation.graphql') => {
    waitForSchema();
    const editorName = uri === 'operation.graphql' ? 'query' : 'variables';
    cy.getEditorModel(editorName).then(model => {
      cy.window()
        .should(win => {
          const markers = win.__MONACO.editor.getModelMarkers({
            resource: model.uri,
          });
          expect(
            markers,
            'initial validation markers',
          ).to.have.length.greaterThan(0);
        })
        .then(() => {
          model.setValue(value);
        });
      cy.window().should(win => {
        const markers = win.__MONACO.editor.getModelMarkers({
          resource: model.uri,
        });
        expect(markers, `${editorName} validation markers`).to.have.length(0);
      });
    });
  },
);
