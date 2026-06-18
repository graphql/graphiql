/**
 * End-to-end tests for "the active operation follows the editor cursor"
 * (@graphiql/react). Moving the cursor between named operations in a
 * multi-operation document updates the active operation, which the session tab
 * reflects as `<name> +N`.
 */

const TWO_OPS = [
  'query Alpha {',
  '  test {',
  '    id',
  '  }',
  '}',
  '',
  'query Beta {',
  '  test {',
  '    id',
  '  }',
  '}',
  '',
].join('\n');

// The title of the active session tab.
const activeTabTitle = () =>
  cy.get('.graphiql-tab-active .graphiql-tab-button');

describe('active operation follows the editor cursor', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit(`?query=${encodeURIComponent(TWO_OPS)}`);
    cy.contains('.view-line', 'query Beta').should('be.visible');
  });

  it('tracks the operation the cursor is in', () => {
    // Click into the second operation.
    cy.contains('.view-line', 'query Beta').click('left', { force: true });
    activeTabTitle().should('contain.text', 'Beta');

    // And back into the first.
    cy.contains('.view-line', 'query Alpha').click('left', { force: true });
    activeTabTitle().should('contain.text', 'Alpha');
  });

  it('shows a +N count of the other operations on the active tab', () => {
    cy.contains('.view-line', 'query Beta').click('left', { force: true });
    activeTabTitle().should('contain.text', 'Beta +1');
  });
});
