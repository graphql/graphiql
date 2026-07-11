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
    cy.get('.graphiql-qb-root-name').should('contain.text', 'Test');
    cy.get('[data-testid="field-row"]').should('have.length.greaterThan', 0);
  });
});

describe('Query Builder – selecting a scalar field', () => {
  it('adds the field to the query when its checkbox is checked', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle id"]').click();

    expectQuery(query => expect(query).to.match(/\bid\b/));
  });

  it('removes the field from the query when its checkbox is unchecked', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle id"]').click();
    expectQuery(query => expect(query).to.match(/\bid\b/));

    cy.get('[aria-label="Toggle id"]').click();
    expectQuery(query => expect(query).to.not.match(/\bid\b/));
  });
});

describe('Query Builder – scalar argument', () => {
  it('adds a string arg to the query when typed into the arg input', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle hasArgs"]').click();

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
   * Editing an argument of a non-first operation resets the active operation to
   * the first one and the cursor sync restores it; that churn unmounts the input
   * on the debounced (~100ms) sync, so without care a user typing at normal pace
   * loses focus between keystrokes and can only enter one character. This guards
   * focus is kept throughout.
   */
  it('keeps input focus after editing a non-first operation arg', () => {
    cy.visit(`?query=${encodeURIComponent(QUERY_THEN_MUTATION)}`);
    cy.contains('.view-line', 'mutation M').should('be.visible');

    // Activate the mutation (the second operation) via the cursor.
    cy.activateOperation('M');

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
   * List items with a typed Int argument must be emitted as unquoted numeric
   * literals (42) rather than quoted strings ("42").
   */
  it('adds a listInt item and emits it as an unquoted integer in the query', () => {
    openQueryBuilder();

    cy.get('[aria-label="Toggle hasArgs"]').click();

    // hasArgs has multiple list args; scope to the listInt row to target the
    // correct "Add item" button.
    cy.contains('.graphiql-qb-arg-row', 'listInt')
      .find('[aria-label="Add item"]')
      .click();

    cy.contains('.graphiql-qb-arg-row', 'listInt')
      .find('input[type="number"]')
      .first()
      .clear()
      .type('42');

    expectQuery(query => {
      const compact = query.replaceAll(/\s+/g, '');
      expect(compact).to.include('hasArgs');
      expect(compact).to.include('listInt:[42]');
      expect(compact).to.not.include('listInt:["42"]');
    });
  });
});

describe('Query Builder – fragment extraction', () => {
  /**
   * Expand a composite field, select a scalar child, then extract the row to a
   * fragment. The selection becomes a spread and a matching fragment definition
   * is appended.
   */
  it('extracts a selected subtree into a named fragment via the row action', () => {
    openQueryBuilder();

    // Expand `person` (a Person-typed composite) and select `name`.
    cy.get('[aria-label="Expand person"]').click();
    cy.get('[aria-label="Toggle name"]').click();
    expectQuery(query =>
      expect(query.replaceAll(/\s+/g, '')).to.include('person{name}'),
    );

    // The extract action reveals on hover; force the click since it starts at
    // opacity 0 until the row is hovered.
    cy.get('[aria-label="Extract person to a fragment"]').click({
      force: true,
    });

    expectQuery(query => {
      const compact = query.replaceAll(/\s+/g, '');
      expect(compact).to.include('person{...PersonFields}');
      expect(query).to.match(/fragment\s+PersonFields\s+on\s+Person/);
      expect(compact).to.include('name');
    });

    // The fragment is listed and the row shows the spread state.
    cy.get('.graphiql-qb-fragment-name').should('contain.text', 'PersonFields');
    cy.get('[data-testid="field-spread"]').should(
      'contain.text',
      'PersonFields',
    );
  });

  /**
   * With a document that already defines a Person fragment, a second Person
   * field offers "Use ...PersonFields" instead of forcing a new fragment.
   */
  it('reuses an existing fragment on another field of the same type', () => {
    const QUERY = `{
  person { ...PersonFields }
  test { person { name } }
}

fragment PersonFields on Person {
  name
}
`;
    cy.visit(`?query=${encodeURIComponent(QUERY)}`);
    openQueryBuilder();

    // Drill into test → person (a second Person-typed field) and reuse.
    cy.get('[aria-label="Expand test"]').click();
    cy.get('[aria-label="Expand person"]').filter(':visible').last().click();
    cy.get('[aria-label="Spread PersonFields into person"]').click({
      force: true,
    });

    expectQuery(query => {
      const compact = query.replaceAll(/\s+/g, '');
      expect(compact).to.include('test{person{...PersonFields}}');
      // Exactly one fragment definition — no duplicate created.
      expect(compact.match(/fragmentPersonFields/g)).to.have.length(1);
    });
  });

  /**
   * The extract action is a plain, keyboard-focusable <button> (no negative
   * tabindex, no hover-only operability): it can take focus and activate while
   * focused. Native Enter/Space activation of the button element is covered by
   * the plugin unit tests via userEvent.
   */
  it('exposes the extract action as a focusable, operable button', () => {
    openQueryBuilder();

    cy.get('[aria-label="Expand person"]').click();
    cy.get('[aria-label="Toggle name"]').click();

    cy.get('[aria-label="Extract person to a fragment"]')
      .focus()
      .should('be.focused')
      .click();

    expectQuery(query =>
      expect(query.replaceAll(/\s+/g, '')).to.include(
        'person{...PersonFields}',
      ),
    );
  });
});
