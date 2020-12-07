describe('GraphiQL DocExplorer - button', () => {
  before(() => {
    cy.visit(`/`);
  });
  it('Toggles doc pane on', () => {
    cy.get('.docExplorerShow').click();
    cy.get('.doc-explorer').should('be.visible');
  });

  it('Toggles doc pane back off', () => {
    // there are two components with .docExplorerHide, one in query history
    cy.get('.docExplorerWrap button.docExplorerHide').click();
    cy.get('.doc-explorer').should('not.exist');
  });
});

describe('GraphiQL DocExplorer - search', () => {
  before(() => {
    cy.visit(`/`);
    cy.get('.docExplorerShow').click();
  });

  it('Searches docs for values', () => {
    cy.get('label.search-box input').type('test');
    cy.get('.doc-category-item').should('have.length', 8);
  });

  it('Navigates to a docs entry on selecting a search result', () => {
    cy.get('.doc-search-items>.doc-category-item').eq(4).children().click();
    cy.get('.doc-explorer-title').should('have.text', 'TestInput');
  });

  it('Allows searching fields within a type', () => {
    cy.get('label.search-box input').type('list');
    cy.get('.doc-category-item').should('have.length', 8);
  });

  it('Shows "other results" section', () => {
    cy.get('.doc-category-title').should('have.text', 'other results');
    cy.get('.doc-category .field-name').should('have.text', 'hasArgs');
  });

  it('Navigates back to search results when existing', () => {
    cy.get('.doc-explorer-back').click();
    cy.get('.doc-explorer-title').should('have.text', 'Documentation Explorer');
  });

  it('Retains the parent search value', () => {
    cy.get('label.search-box input').should('have.value', 'test');
  });

  it('Type fields link to their own docs entry', () => {
    cy.get('label.search-box input').type('test');
    cy.get('.doc-search-items>.doc-category-item')
      .last()
      .find('a:nth-child(2)')
      .click();
    cy.pause();
    cy.get('.doc-explorer-title').should('have.text', 'subscribeToTest');
    cy.get('.doc-type-description').should(
      'have.text',
      'Subscribe to the test type\n',
    );
  });

  it('Allows clearing the search', () => {
    cy.visit(`/`);
    cy.get('.docExplorerShow').click();
    cy.get('label.search-box input').type('test');
    cy.get('.search-box-clear').click();
    cy.get('.doc-category-title').should('have.text', 'root types');
    cy.get('label.search-box input').should('have.value', '');
  });
});

describe('GraphQL DocExplorer - deprecated fields', () => {
  before(() => {
    cy.visit(`/`);
    cy.get('.docExplorerShow').click();
  });
  it('should show deprecated fields category title', () => {
    cy.get('.doc-category>.doc-category-item').first().find('a').click();
    cy.get('.doc-category>.doc-category-title')
      .last()
      .should('have.text', 'deprecated fields');
  });
  it('should show deprecated fields details when expanding', () => {
    cy.get('.show-btn').click();

    const deprecated = cy.get('.doc-category').last();
    deprecated
      .get('.field-short-description')
      .should('contain.text', 'This field is an example of a deprecated field');
    deprecated
      .get('.doc-deprecation')
      .should(
        'contain.html',
        '<p>No longer in use, try <code>test</code> instead.</p>',
      );
  });
});
