/**
 * End-to-end tests for the Query Builder plugin as assembled inside the
 * full GraphiQL app. The unit tests for the plugin itself live in
 * packages/graphiql-plugin-query-builder; these tests drive the builder
 * through the real browser-rendered application.
 *
 * Plugin order in the activity rail (from GraphiQL.tsx):
 *   0 – Doc Explorer  (referencePlugin)
 *   1 – History       (plugins[0])
 *   2 – Query Builder (plugins[1])
 */

function openQueryBuilder() {
  cy.get('button[aria-label="Show Query Builder"]').click();
  cy.get('aside[aria-label="Query Builder"]').should('be.visible');
}

beforeEach(() => {
  cy.visit('?defaultQuery=');
});

describe('Query Builder – panel toggle', () => {
  it('opens and closes the side panel', () => {
    openQueryBuilder();
    cy.get('.graphiql-query-builder').should('be.visible');

    cy.get('button[aria-label="Hide Query Builder"]').click();
    cy.get('aside[aria-label="Query Builder"]').should('not.exist');
  });

  it('shows the schema root type when a schema is available', () => {
    openQueryBuilder();
    // The test schema query type is named "Test"
    cy.get('.graphiql-qb-root-name').should('contain.text', 'Test');
    // At least one field row should be rendered
    cy.get('[data-testid="field-row"]').should('have.length.greaterThan', 0);
  });
});

describe('Query Builder – selecting a scalar field', () => {
  it('adds the field to the query editor when its checkbox is checked', () => {
    openQueryBuilder();

    // Check the "id" field – it is a scalar (ID), no children
    cy.get('[aria-label="Toggle id"]').click();

    // The query editor should now contain the field name
    cy.get('.graphiql-query-editor .view-lines.monaco-mouse-cursor-text').should(
      element => {
        const text = element.get(0).innerText;
        expect(text).to.include('id');
      },
    );
  });

  it('removes the field from the editor when its checkbox is unchecked', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle id"]').click();
    // Confirm it was added
    cy.get('.graphiql-query-editor .view-lines.monaco-mouse-cursor-text').should(
      element => {
        expect(element.get(0).innerText).to.include('id');
      },
    );

    // Uncheck
    cy.get('[aria-label="Toggle id"]').click();
    cy.get('.graphiql-query-editor .view-lines.monaco-mouse-cursor-text').should(
      element => {
        // After unchecking, "id" should no longer appear as a selected field
        // (the editor may still contain "__typename" from the fallback parse,
        // but the explicit "id" selection should be gone)
        const text = element.get(0).innerText;
        expect(text).to.not.include('\nid');
      },
    );
  });
});

describe('Query Builder – scalar argument', () => {
  it('adds a string arg to the query when typed into the arg input', () => {
    openQueryBuilder();

    // Select "hasArgs" – it is a String field with many args
    cy.get('[aria-label="Toggle hasArgs"]').click();

    // The "string" arg input should now appear (field is selected, has args)
    cy.get('[aria-label="string"]').should('be.visible').type('hello');

    // Editor should reflect the arg value
    cy.get('.graphiql-query-editor .view-lines.monaco-mouse-cursor-text').should(
      element => {
        const text = element.get(0).innerText;
        expect(text).to.include('hasArgs');
        expect(text).to.include('string: "hello"');
      },
    );
  });
});

describe('Query Builder – list argument (Int[])', () => {
  /**
   * This test exercises the fix that ensures list items with typed arguments
   * are emitted as unquoted numeric literals (42) rather than quoted strings
   * ("42") when the item type is Int.
   */
  it('adds a listInt item and emits it as an unquoted integer in the query', () => {
    openQueryBuilder();

    // Select "hasArgs" to expose its args
    cy.get('[aria-label="Toggle hasArgs"]').click();

    // The "listInt" arg renders a ListArgInput – click "Add item"
    cy.get('[aria-label="Add item"]').first().click();

    // An integer input should appear for the new list item
    cy.get('.graphiql-qb-list-arg input[type="number"]').first().clear().type('42');

    // The query editor must contain the list arg with an unquoted integer value
    cy.get('.graphiql-query-editor .view-lines.monaco-mouse-cursor-text').should(
      element => {
        const text = element.get(0).innerText;
        expect(text).to.include('hasArgs');
        // Must be [42], not ["42"]
        expect(text).to.include('listInt: [42]');
        expect(text).to.not.include('listInt: ["42"]');
      },
    );
  });
});
