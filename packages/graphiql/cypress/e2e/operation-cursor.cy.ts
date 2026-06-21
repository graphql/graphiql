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
    cy.visit(`?query=${encodeURIComponent(TWO_OPS)}`);
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
