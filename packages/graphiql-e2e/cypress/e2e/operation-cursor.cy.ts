/**
 * End-to-end tests for "the active operation follows the editor cursor"
 * (@graphiql/react). Moving the cursor between named operations in a
 * multi-operation document updates the active operation, which the session tab
 * reflects as `<name> +N`.
 */

const TWO_OPS = `query Alpha {
  test {
    id
  }
}

query Beta {
  test {
    id
  }
}
`;

// The title of the active session tab.
const activeTabTitle = () =>
  cy.get('.graphiql-tab-active .graphiql-tab-button');

describe('active operation follows the editor cursor', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visitGraphiQL({ query: TWO_OPS });
    // Gate on Monaco having painted the document before driving the cursor.
    cy.contains('.view-line', 'query Beta').should('be.visible');
  });

  it('tracks the operation the cursor is in', () => {
    cy.activateOperation('Beta');
    activeTabTitle().should('contain.text', 'Beta');

    cy.activateOperation('Alpha');
    activeTabTitle().should('contain.text', 'Alpha');
  });

  it('shows a +N count of the other operations on the active tab', () => {
    cy.activateOperation('Beta');
    activeTabTitle().should('contain.text', 'Beta +1');
  });
});

// Replace the document and run in one browser callback so the content debounce
// cannot reconcile the previous operation name before execution.
describe('immediate execution after replacing the document', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visitGraphiQL({ query: 'query Changed { test { id } }' });
    cy.waitForQueryEditor();
    cy.intercept('POST', '/graphql', request => {
      if (!request.body.query.includes('__schema')) {
        request.alias = 'immediateRun';
        request.reply({ body: { data: { test: { id: '1' } } } });
      }
    });
  });

  it('uses the displayed document when Run is clicked immediately', () => {
    const query = 'query Saved { test { id } }';
    cy.window().then(win => {
      const model = win.__MONACO.editor
        .getModels()
        .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
      model.setValue(query);
      win.document
        .querySelector<HTMLButtonElement>('.graphiql-execute-button-primary')!
        .click();
    });
    cy.wait('@immediateRun')
      .its('request.body')
      .should('include', { query, operationName: 'Saved' });
  });

  it('uses current operation ranges for the keyboard Run action', () => {
    const query = 'query Alpha { test { id } }\nquery Saved { test { id } }';
    cy.window().then(win => {
      const model = win.__MONACO.editor
        .getModels()
        .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
      const editor = win.__MONACO.editor
        .getEditors()
        .find(candidate => candidate.getModel() === model)!;
      model.setValue(query);
      editor.setPosition({ lineNumber: 2, column: 15 });
      void editor.getAction('graphql-run')!.run();
    });
    cy.wait('@immediateRun')
      .its('request.body')
      .should('include', { query, operationName: 'Saved' });
  });
});
