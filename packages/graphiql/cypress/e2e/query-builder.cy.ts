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
 *
 * Editor content is asserted via the query GraphiQL persists to the URL rather
 * than the rendered Monaco lines: the builder writes to the editor model, which
 * syncs to the URL deterministically, whereas Monaco only paints `.view-lines`
 * into the DOM on a layout pass and can read empty in a headless run. The URL
 * still verifies the builder edit reached the document.
 */

function openQueryBuilder() {
  cy.get('button[aria-label="Show Query Builder"]').click();
  cy.get('aside[aria-label="Query Builder"]').should('be.visible');
}

/** Asserts against the operation GraphiQL has persisted to the `?query=` URL. */
function expectQuery(assertion: (query: string) => void) {
  cy.location('search').should(search => {
    assertion(decodeURIComponent(search));
  });
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
  it('adds the field to the query when its checkbox is checked', () => {
    openQueryBuilder();

    // Check the "id" field – it is a scalar (ID), no children
    cy.get('[aria-label="Toggle id"]').click();

    expectQuery(query => expect(query).to.match(/\bid\b/));
  });

  it('removes the field from the query when its checkbox is unchecked', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle id"]').click();
    expectQuery(query => expect(query).to.match(/\bid\b/));

    // Uncheck
    cy.get('[aria-label="Toggle id"]').click();
    expectQuery(query => expect(query).to.not.match(/\bid\b/));
  });
});

describe('Query Builder – scalar argument', () => {
  it('adds a string arg to the query when typed into the arg input', () => {
    openQueryBuilder();

    // Select "hasArgs" – it is a String field with many args
    cy.get('[aria-label="Toggle hasArgs"]').click();

    // The "string" arg input should now appear (field is selected, has args)
    cy.get('[aria-label="string"]').should('be.visible').type('hello');

    expectQuery(query => {
      const compact = query.replaceAll(/\s+/g, '');
      expect(compact).to.include('hasArgs');
      expect(compact).to.include('string:"hello"');
    });
  });
});

describe('Query Builder – editing a non-first operation', () => {
  const QUERY_THEN_MUTATION = `query Q {
  id
}

mutation M {
  setString(value: "a")
}
`;

  /**
   * Regression: editing an argument of an operation that is not the first in
   * the document used to remount the whole field tree shortly after each edit —
   * the builder's write reset the active operation to the first one and the
   * cursor sync restored it, and that churn unmounted the input. The remount
   * runs on the editor's debounced (~100ms) sync, so a user typing at a normal
   * pace lost focus between keystrokes and could only enter one character.
   */
  it('keeps input focus after editing a non-first operation arg', () => {
    cy.visit(`?query=${encodeURIComponent(QUERY_THEN_MUTATION)}`);
    cy.contains('.view-line', 'mutation M').should('be.visible');

    // Activate the mutation (the second operation) via the cursor.
    cy.contains('.view-line', 'mutation M').click('left', { force: true });

    openQueryBuilder();
    cy.get('.graphiql-qb-root-name').should('contain.text', 'MutationType');

    cy.get('[aria-label="value"]').should('have.value', 'a').type('b');

    // Wait past the editor's debounced sync, where the buggy remount happened,
    // then confirm focus is still on the same input rather than dropped to body.
    cy.wait(300); // eslint-disable-line cypress/no-unnecessary-waiting
    cy.focused().should('have.attr', 'aria-label', 'value');

    expectQuery(query =>
      expect(query.replaceAll(/\s+/g, '')).to.include('setString(value:"ab")'),
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

    // hasArgs has several list args (listString, listInt, ...). Scope to the
    // listInt row specifically — its "Add item" button and number input.
    cy.contains('.graphiql-qb-arg-row', 'listInt')
      .find('[aria-label="Add item"]')
      .click();

    // An integer input should appear for the new list item (and persist)
    cy.contains('.graphiql-qb-arg-row', 'listInt')
      .find('input[type="number"]')
      .first()
      .clear()
      .type('42');

    expectQuery(query => {
      const compact = query.replaceAll(/\s+/g, '');
      expect(compact).to.include('hasArgs');
      // Must be [42], not ["42"]
      expect(compact).to.include('listInt:[42]');
      expect(compact).to.not.include('listInt:["42"]');
    });
  });
});
