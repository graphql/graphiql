import { version } from 'graphql/version';

describe('GraphiQL DocExplorer - button', () => {
  before(() => {
    cy.visit(`/`);
  });
  it('Toggles doc pane on', () => {
    cy.get('.graphiql-sidebar button').eq(0).click();
    cy.get('.doc-explorer').should('be.visible');
  });

  it('Toggles doc pane back off', () => {
    // there are two components with .docExplorerHide, one in query history
    cy.get('.docExplorerWrap button.docExplorerHide').click();
    cy.get('.doc-explorer').should('not.be.visible');
  });
});

describe('GraphiQL DocExplorer - search', () => {
  before(() => {
    cy.visit(`/`);
    cy.get('.graphiql-sidebar button').eq(0).click();
  });

  it('Searches docs for values', () => {
    cy.get('label.search-box input').type('test');
    cy.get('.doc-category-item').should('have.length', 7);
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
    cy.get('.doc-search-items>.doc-category-item')
      .last()
      .find('a:nth-child(2)')
      .click();

    cy.get('.doc-explorer-title').should('have.text', 'isTest');
    cy.get('.doc-type-description').should(
      'have.text',
      'Is this a test schema? Sure it is.\n',
    );
  });

  it('Allows clearing the search', () => {
    cy.visit(`/`);
    cy.get('.graphiql-sidebar button').eq(0).click();
    cy.get('label.search-box input').type('test');
    cy.get('.search-box-clear').click();
    cy.get('.doc-category-title').should('have.text', 'root types');
    cy.get('label.search-box input').should('have.value', '');
  });
});

describe('GraphQL DocExplorer - deprecated fields', () => {
  before(() => {
    cy.visit(`/`);
    cy.get('.graphiql-sidebar button').eq(0).click();
  });
  it('should show deprecated fields category title', () => {
    cy.get('.doc-category>.doc-category-item').first().find('a').click();
    cy.wait(300);
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

let describeOrSkip = describe.skip;

// TODO: disable when defer/stream is merged to graphql
if (!version.includes('15.5')) {
  describeOrSkip = describe;
}

describeOrSkip('GraphQL DocExplorer - deprecated arguments', () => {
  it('should show deprecated arguments category title', () => {
    cy.get('#doc-fields .doc-category-item a.field-name').last().click();
    cy.get('#doc-deprecated-args>.doc-category-title')
      .last()
      .should('have.text', 'deprecated arguments');
    cy.get('.show-btn').click();
    cy.get('.doc-deprecation').should('have.text', 'deprecated argument\n');
  });
});
