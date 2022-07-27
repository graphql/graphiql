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
    cy.get('.graphiql-plugin button.docExplorerHide').click();
    cy.get('.doc-explorer').should('not.be.visible');
  });
});

describe('GraphiQL DocExplorer - search', () => {
  before(() => {
    cy.visit(`/`);
    cy.get('.graphiql-sidebar button').eq(0).click();
  });

  it('Searches docs for values', () => {
    cy.get('[data-reach-combobox-input]').type('test');
    cy.get('[data-reach-combobox-popover]').should('not.have.attr', 'hidden');
    cy.get('[data-reach-combobox-option]').should('have.length', 7);
  });

  it('Navigates to a docs entry on selecting a search result', () => {
    cy.get('[data-reach-combobox-option]').eq(4).children().click();
    cy.get('.doc-explorer-title').should('have.text', 'TestInput');
  });

  it('Allows searching fields within a type', () => {
    cy.get('[data-reach-combobox-input]').type('list');
    cy.get('[data-reach-combobox-option]').should('have.length', 14);
  });

  it('Shows "other results" section', () => {
    cy.get(
      '[data-reach-combobox-popover] .graphiql-doc-explorer-search-divider',
    ).should('have.text', 'Other results');
    cy.get('[data-reach-combobox-option]').contains('hasArgs');
  });

  it('Navigates back and closes popover', () => {
    cy.get('.doc-explorer-back').click();
    cy.get('.doc-explorer-title').should('have.text', 'Docs');
    cy.get('[data-reach-combobox-popover]').should('have.attr', 'hidden');
  });

  it('Type fields link to their own docs entry', () => {
    cy.get('[data-reach-combobox-input]').type('test');
    cy.wait(250);
    cy.get('[data-reach-combobox-option]').last().click();

    cy.get('.doc-explorer-title').should('have.text', 'isTest');
    cy.get('.graphiql-markdown-description').should(
      'have.text',
      'Is this a test schema? Sure it is.\n',
    );
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
      .get('.graphiql-markdown-description')
      .should('contain.text', 'This field is an example of a deprecated field');
    deprecated
      .get('.graphiql-markdown-deprecation')
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
    cy.get('#doc-fields .doc-category-item a.graphiql-doc-explorer-field-name')
      .last()
      .click();
    cy.get('#doc-deprecated-args>.doc-category-title')
      .last()
      .should('have.text', 'deprecated arguments');
    cy.get('.show-btn').click();
    cy.get('.graphiql-markdown-deprecation').should(
      'have.text',
      'deprecated argument\n',
    );
  });
});
