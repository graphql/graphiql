function setQuery(query: string) {
  cy.window().then(win => {
    const model = win.__MONACO.editor
      .getModels()
      .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
    model.setValue(query);
  });
}

function saveNewOperation() {
  cy.get('[aria-label="Save query"], [aria-label="Save operation"]').click();
  cy.contains('label', 'Operation name')
    .find('input')
    .clear()
    .type('Saved operation');
  cy.get('[role="dialog"]')
    .contains('button', /^Save$/)
    .click();
  cy.get('[role="dialog"]').should('not.exist');
}

function expectPersistedQuery(query: string) {
  cy.window().then(win => {
    const state = JSON.parse(win.localStorage.getItem('graphiql:tabState')!);
    expect(state.tabs[state.activeTabIndex]).to.include({
      query,
      lastSavedQuery: query,
    });
    expect(win.localStorage.getItem('graphiql:query')).to.equal(query);
  });
}

function reopenSavedOperation(query: string) {
  cy.reload();
  cy.waitForQueryEditor();
  cy.window().should(win => {
    const model = win.__MONACO.editor
      .getModels()
      .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
    expect(model.getValue()).to.equal(query);
  });
  cy.get('[aria-label="Show Collections"]').click();
  cy.contains('.graphiql-collection-item-row', 'Saved operation').click();
  cy.window().then(win => {
    const model = win.__MONACO.editor
      .getModels()
      .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
    expect(model.getValue()).to.equal(query);
  });
}

describe('Collections saves', () => {
  it('survives reloading before any edit or tab-persistence timer runs', () => {
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
    cy.visitGraphiQL({ defaultQuery: '' });
    cy.get('[aria-label="Show Collections"]').should('be.visible');
    const query = 'query Saved { id }';
    setQuery(query);

    saveNewOperation();

    expectPersistedQuery(query);
    reopenSavedOperation(query);
  });

  it('persists updates to a linked item without losing later unsaved edits', () => {
    cy.clock(Date.now(), ['setTimeout', 'clearTimeout']);
    cy.visitGraphiQL({ defaultQuery: '' });
    cy.get('[aria-label="Show Collections"]').should('be.visible');
    setQuery('query First { id }');
    saveNewOperation();
    const query = 'query Updated { image }';
    setQuery(query);

    cy.get('[aria-label="Save query"], [aria-label="Save operation"]').click();

    cy.get('[role="dialog"]').should('not.exist');
    expectPersistedQuery(query);
    reopenSavedOperation(query);
    const unsavedQuery = 'query Unsaved { id image }';
    setQuery(unsavedQuery);
    cy.contains('.graphiql-collection-item-row', 'Saved operation').click();
    cy.window().then(win => {
      const model = win.__MONACO.editor
        .getModels()
        .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
      expect(model.getValue()).to.equal(unsavedQuery);
    });
  });
});
