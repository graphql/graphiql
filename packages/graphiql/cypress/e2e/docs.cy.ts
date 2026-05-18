import { version } from 'graphql';

beforeEach(() => {
  cy.visit('/');
});

describe('GraphiQL DocExplorer - button', () => {
  beforeEach(() => {
    cy.get('.graphiql-activity-rail-item').eq(0).click();
  });
  it('Toggles doc pane on', () => {
    cy.get('.graphiql-doc-explorer').should('be.visible');
  });

  it('Toggles doc pane back off', () => {
    cy.get('.graphiql-activity-rail-item').eq(0).click();
    cy.get('.graphiql-doc-explorer').should('not.exist');
  });
});

describe('GraphiQL DocExplorer - search', () => {
  beforeEach(() => {
    cy.get('.graphiql-activity-rail-item').eq(0).click();
    cy.dataCy('doc-explorer-input').type('test');
    cy.dataCy('doc-explorer-option').should('have.length', 7);
  });

  it('Searches docs for values', () => {
    cy.dataCy('doc-explorer-list').should('not.have.attr', 'hidden');
  });

  it('Navigates to a docs entry on selecting a search result', () => {
    cy.dataCy('doc-explorer-option').eq(4).children().click();
    cy.get('.graphiql-doc-explorer-breadcrumb-current').should(
      'have.text',
      'TestInput',
    );
  });

  it('Allows searching fields within a type', () => {
    cy.dataCy('doc-explorer-option').eq(4).children().click();
    cy.dataCy('doc-explorer-input').clear().type('list');
    cy.dataCy('doc-explorer-option').should('have.length', 14);
    cy.get('.graphiql-doc-explorer-search-divider').should(
      'have.text',
      'Other results',
    );
    cy.dataCy('doc-explorer-option').contains('hasArgs');
  });

  it('Closes popover when blurring input', () => {
    cy.dataCy('doc-explorer-input').focus();
    cy.dataCy('doc-explorer-input').type('list');
    cy.dataCy('doc-explorer-input').blur();
    cy.dataCy('doc-explorer-list').should('not.exist');
  });

  it('Navigates back', () => {
    cy.dataCy('doc-explorer-option').eq(4).children().click();
    // Click the root breadcrumb segment (first link, at depth 0 = "Docs")
    cy.get('.graphiql-doc-explorer-breadcrumb-root').click();
    // After navigating back, breadcrumb disappears (at root level, no breadcrumb shown)
    cy.get('.graphiql-doc-explorer-breadcrumb').should('not.exist');
  });

  it('Type fields link to their own docs entry', () => {
    cy.dataCy('doc-explorer-option').last().click();
    cy.get('.graphiql-doc-explorer-breadcrumb-current').should(
      'have.text',
      'isTest',
    );
    cy.get('.graphiql-markdown-description').should(
      'have.text',
      'Is this a test schema? Sure it is.\n',
    );
  });
});

describe('GraphQL DocExplorer - deprecated fields', () => {
  it('should show deprecated fields details when expanding', () => {
    // Open doc explorer
    cy.get('.graphiql-activity-rail-item').eq(0).click();

    // Select query type
    cy.get('.graphiql-doc-explorer-type-name').first().click();

    // Show deprecated fields
    cy.contains('Show Deprecated Fields').click();

    // Click into the deprecated field to view its documentation
    cy.contains(
      'button.graphiql-doc-explorer-field-row--deprecated',
      'deprecatedField',
    ).click();

    // Assert description and deprecation reason are shown
    cy.get('.graphiql-markdown-description').should(
      'contain.text',
      'This field is an example of a deprecated field',
    );
    cy.get('.graphiql-markdown-deprecation').should(
      'contain.html',
      '<p>No longer in use, try <code>test</code> instead.</p>',
    );
  });
});

let describeOrSkip = describe.skip;

if (!version.includes('15.5')) {
  describeOrSkip = describe;
}

describeOrSkip('GraphQL DocExplorer - deprecated arguments', () => {
  it('should show deprecated arguments category title', () => {
    // Open doc explorer
    cy.get('.graphiql-activity-rail-item').eq(0).click();

    // Select query type
    cy.get('.graphiql-doc-explorer-type-name').first().click();

    cy.contains('button.graphiql-doc-explorer-field-row', 'hasArgs').click();
    cy.contains('Show Deprecated Arguments').click();
    cy.get('.graphiql-doc-explorer-section-title').contains(
      'Deprecated Arguments',
    );
    cy.get('.graphiql-markdown-deprecation').should(
      'have.text',
      'Argument "deprecatedArg" is deprecated. Use "string" instead.\n',
    );
  });
});
