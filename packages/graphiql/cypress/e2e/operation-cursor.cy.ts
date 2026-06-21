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

// 0-indexed line of `query Beta`, i.e. how many `{downArrow}` presses from the
// top of the document land the cursor inside the second operation.
const BETA_LINE = TWO_OPS.split('\n').findIndex(line =>
  line.startsWith('query Beta'),
);

// The title of the active session tab.
const activeTabTitle = () =>
  cy.get('.graphiql-tab-active .graphiql-tab-button');

// Monaco's hidden input. Driving the cursor with the keyboard through this
// stable element is deliberate: the `.view-line` nodes are repainted on layout
// passes, so clicking one can race the repaint and silently miss in headless
// runs (the cause of this spec's earlier flakiness). Keyboard navigation also
// produces the `Explicit` cursor change that operation tracking keys off of,
// and lands at deterministic, in-operation offsets.
const editor = () => cy.get('.graphiql-query-editor textarea');

// `{upArrow}` past the top clamps at line 1 (inside Alpha); `{home}` pins the
// column so the landing offset is unambiguous regardless of the prior position.
const TO_TOP = '{upArrow}'.repeat(20);
const goToAlpha = () => editor().type(`${TO_TOP}{home}`, { force: true });
const goToBeta = () =>
  editor().type(`${TO_TOP}${'{downArrow}'.repeat(BETA_LINE)}{home}`, {
    force: true,
  });

describe('active operation follows the editor cursor', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit(`?query=${encodeURIComponent(TWO_OPS)}`);
    // Gate on Monaco having painted the document before we type into it.
    cy.contains('.view-line', 'query Beta').should('be.visible');
  });

  it('tracks the operation the cursor is in', () => {
    // Move the cursor into the second operation.
    goToBeta();
    activeTabTitle().should('contain.text', 'Beta');

    // And back into the first.
    goToAlpha();
    activeTabTitle().should('contain.text', 'Alpha');
  });

  it('shows a +N count of the other operations on the active tab', () => {
    goToBeta();
    activeTabTitle().should('contain.text', 'Beta +1');
  });
});
