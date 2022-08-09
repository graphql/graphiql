import { version } from 'graphql/version';

describe('GraphiQL DocExplorer - button', () => {
  before(() => {
    cy.visit(`/`);
  });
  it('Toggles doc pane on', () => {
    cy.get('.graphiql-sidebar button').eq(0).click();
    cy.get('.graphiql-doc-explorer').should('be.visible');
  });

  it('Toggles doc pane back off', () => {
    cy.get('.graphiql-sidebar button').eq(0).click();
    cy.get('.graphiql-doc-explorer').should('not.be.visible');
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
    cy.get('.graphiql-doc-explorer-title').should('have.text', 'TestInput');
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

  it('Closes popover when blurring input', () => {
    cy.get('[data-reach-combobox-input]').blur();
    cy.get('[data-reach-combobox-popover]').should('have.attr', 'hidden');
  });

  it('Navigates back', () => {
    cy.get('.graphiql-doc-explorer-back').click();
    cy.get('.graphiql-doc-explorer-title').should('have.text', 'Docs');
  });

  it('Type fields link to their own docs entry', () => {
    cy.get('[data-reach-combobox-input]').type('test');
    cy.wait(250);
    cy.get('[data-reach-combobox-option]').last().click();

    cy.get('.graphiql-doc-explorer-title').should('have.text', 'isTest');
    cy.get('.graphiql-markdown-description').should(
      'have.text',
      'Is this a test schema? Sure it is.\n',
    );
  });
});

describe('GraphQL DocExplorer - deprecated fields', () => {
  it('should show deprecated fields details when expanding', () => {
    cy.visit(`/`);
    // Open doc explorer
    cy.get('.graphiql-sidebar button').eq(0).click();

    // Select query type
    cy.get('.graphiql-doc-explorer-type-name').first().click();

    // Show deprecated fields
    cy.contains('Show Deprecated Fields').click();

    // Assert that title is shown
    cy.get('.graphiql-doc-explorer-section-title').contains(
      'Deprecated Fields',
    );

    // Assert that the deprecated field is shown correctly
    cy.get('.graphiql-doc-explorer-field-name')
      .contains('deprecatedField')
      .closest('.graphiql-doc-explorer-item')
      .should('contain.text', 'This field is an example of a deprecated field')
      .and(
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
    cy.get('.graphiql-doc-explorer-field-name').contains('hasArgs').click();
    cy.contains('Show Deprecated Arguments').click();
    cy.get('.graphiql-doc-explorer-section-title').contains(
      'Deprecated Arguments',
    );
    cy.get('.graphiql-markdown-deprecation').should(
      'have.text',
      'deprecated argument\n',
    );
  });
});
