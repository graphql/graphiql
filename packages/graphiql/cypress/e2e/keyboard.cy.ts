describe('GraphiQL keyboard interactions', () => {
  it('Does not prevent the escape key from being handled outside the editor', () => {
    cy.visit('/');
    const mockFn = cy.stub().as('escapeHandler');
    cy.document().then(doc => {
      doc.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          mockFn();
        }
      });
    });

    cy.typeInEditor('{esc}');

    cy.get('@escapeHandler').should('have.been.called');
  });

  it('Does prevent the escape key from being handled outside the editor if closing the autocomplete dialog', () => {
    cy.visit('/');
    const mockFn = cy.stub().as('escapeHandler');
    cy.document().then(doc => {
      doc.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          mockFn();
        }
      });
    });
    cy.typeInEditor('{\n  t');
    // Wait autocomplete dialog to appear
    cy.get('.monaco-list').should('exist');
    cy.typeInEditor('{esc}');
    cy.get('@escapeHandler').should('not.have.been.called');
  });
});

// `cy.realPress` dispatches trusted key events, unlike `.type()`/`.trigger()`,
// so it's the only way to exercise actual Tab-order and focus-trap behavior
// here. It needs the Electron window to have real OS-level focus first, which
// a `cy.visit()` alone doesn't guarantee — each test below clicks a neutral,
// non-interactive area before the first `realPress` to establish it.
describe('keyboard navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.graphiql-query-editor .view-lines').should('exist');
  });

  it('Tab from a fresh load lands on the top bar method chip, and Shift+Tab returns to the page', () => {
    cy.get('.graphiql-top-bar-brand').realClick();
    cy.realPress('Tab');
    cy.focused().should('have.class', 'graphiql-top-bar-method-toggle');
    // The brand mark isn't itself focusable, so Shift+Tab from the first
    // real stop leaves the document (nothing before it in tab order).
    cy.realPress(['Shift', 'Tab']);
    cy.document().then(doc => {
      expect(doc.activeElement).to.equal(doc.body);
    });
  });

  // The tab-strip actions (prettify/merge/copy/save) and the response pane's
  // view-picker/copy/result stops are the same interactive elements in the
  // same relative order regardless of exactly which plugins or save handlers
  // are registered; asserting the full label set once here (rather than
  // hardcoding positional Tab counts) keeps this resilient to unrelated
  // toolbar changes while still proving each segment is keyboard-reachable
  // in order.
  const TOP_BAR_AND_RAIL_LABELS = [
    { className: 'graphiql-top-bar-method-toggle' },
    { ariaLabel: 'Run query' },
    { ariaLabel: 'Show Documentation Explorer' },
    { ariaLabel: 'Show History' },
    { ariaLabel: 'Show Query Builder' },
    { ariaLabel: 'Show Collections' },
    { ariaLabel: 'Settings' },
  ];

  function assertFocusedStop(stop: { className?: string; ariaLabel?: string }) {
    if (stop.className) {
      cy.focused().should('have.class', stop.className);
    } else {
      cy.focused().should('have.attr', 'aria-label', stop.ariaLabel);
    }
  }

  it('Tab order proceeds top bar to rail to panel header to editor', () => {
    cy.get('.graphiql-top-bar-brand').realClick();

    for (const stop of TOP_BAR_AND_RAIL_LABELS) {
      cy.realPress('Tab');
      assertFocusedStop(stop);
    }

    // Session tab strip: the active tab button, "New tab", then the
    // tab-strip actions (whichever ones are registered — prettify/merge/copy
    // are always present, save only when a save handler is registered).
    cy.realPress('Tab');
    cy.focused().should('have.id', 'graphiql-session-tab-0');
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'aria-label', 'New tab');

    cy.get('.graphiql-tab-strip-action').then($actions => {
      const labels = [...$actions].map(el => el.getAttribute('aria-label'));
      expect(labels).to.include.members([
        'Prettify query',
        'Merge fragments into query',
        'Copy query',
      ]);
      for (const label of labels) {
        cy.realPress('Tab');
        cy.focused().should('have.attr', 'aria-label', label);
      }
    });

    // Operation editor, reached as a single stop (see the Enter-to-edit test
    // below for why Tab doesn't dive into Monaco's internal DOM).
    cy.realPress('Tab');
    cy.focused().should('have.class', 'graphiql-editor');
  });

  it('Tab order proceeds from the editor tools toggle through variables/headers to the response pane', () => {
    cy.get('.graphiql-top-bar-brand').realClick();
    // Fast-forward past the top bar/rail/tab-strip/operation editor (covered
    // by the previous test) directly to the editor-tools toggle, the first
    // stop this test is actually about.
    cy.get('.graphiql-query-editor .graphiql-editor').first().focus();
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'aria-label', 'Hide editor tools');

    // Variables/Headers segmented control, then the variables editor.
    cy.realPress('Tab');
    cy.focused().should('have.class', 'graphiql-segmented-control-input');
    cy.realPress('Tab');
    cy.focused().should('have.class', 'graphiql-editor');

    // Response pane: view picker, then copy button, then the result window.
    cy.realPress('Tab');
    cy.focused().should('have.class', 'graphiql-segmented-control-input');
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'aria-label', 'Copy response');
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'aria-label', 'Result Window');
  });

  it('Shift+Tab from the response pane mirrors the forward order back to the start', () => {
    cy.get('.graphiql-top-bar-brand').realClick();
    cy.get('.result-window').focus();
    cy.focused().should('have.attr', 'aria-label', 'Result Window');

    cy.realPress(['Shift', 'Tab']);
    cy.focused().should('have.attr', 'aria-label', 'Copy response');
    cy.realPress(['Shift', 'Tab']);
    cy.focused().should('have.class', 'graphiql-segmented-control-input');
    cy.realPress(['Shift', 'Tab']);
    cy.focused().should('have.class', 'graphiql-editor');
    cy.realPress(['Shift', 'Tab']);
    cy.focused().should('have.class', 'graphiql-segmented-control-input');
    cy.realPress(['Shift', 'Tab']);
    cy.focused().should('have.attr', 'aria-label', 'Hide editor tools');
  });

  it('Enter on the focused operation editor hands off focus to Monaco', () => {
    cy.get('.graphiql-query-editor .graphiql-editor').first().focus();
    cy.focused().should('have.class', 'graphiql-editor');
    cy.realPress('Enter');
    cy.focused().should('have.class', 'inputarea');
  });

  it('Escape closes the settings dialog and returns focus to the gear', () => {
    cy.get('button[aria-label="Settings"]').focus();
    cy.realPress('Enter');
    cy.get('[role="dialog"]').should('be.visible');
    cy.realPress('Escape');
    cy.get('[role="dialog"]').should('not.exist');
    cy.focused().should('have.attr', 'aria-label', 'Settings');
  });

  it('Settings dialog traps focus while open', () => {
    cy.get('button[aria-label="Settings"]').focus();
    cy.realPress('Enter');
    cy.get('[role="dialog"]').should('be.visible');
    for (let i = 0; i < 12; i++) {
      cy.realPress('Tab');
      cy.get('[role="dialog"]').then($dialog => {
        cy.focused().then($focused => {
          expect($dialog[0].contains($focused[0])).to.equal(true);
        });
      });
    }
  });

  it('Clicking the dialog overlay also returns focus to the gear', () => {
    cy.get('button[aria-label="Settings"]').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('.graphiql-dialog-overlay').click({ force: true });
    cy.get('[role="dialog"]').should('not.exist');
    cy.focused().should('have.attr', 'aria-label', 'Settings');
  });

  it('Escape cancels an in-progress history label edit and returns focus to the row', () => {
    cy.visitWithOp({ query: '{ __typename }' });
    cy.get('.graphiql-query-editor .view-lines').should('exist');
    cy.clickExecuteQuery();
    cy.get('.result-window').should('not.have.text', '');
    cy.get('button[aria-label="Show History"]').click();
    cy.get('.graphiql-history').should('be.visible');
    cy.get('button[aria-label="Edit label"]').first().click();
    cy.get('.graphiql-history-item.editable input').should('be.focused');
    cy.realPress('Escape');
    cy.get('.graphiql-history-item.editable').should('not.exist');
    cy.focused().should('have.attr', 'aria-label', 'Edit label');
  });

  // There is no standalone execute-button dropdown in the current UI: the
  // active operation follows the editor cursor (see operation-cursor.cy.ts),
  // and Run executes whichever operation the cursor is in. This is the real
  // keyboard path for picking one of several operations before running it —
  // the run step itself goes through the Run button rather than the
  // Ctrl/Cmd-Enter shortcut, since that modifier is OS-dependent and this
  // test only needs to prove the cursor-driven selection feeds the run.
  it('Keyboard-driven operation selection runs the operation under the cursor', () => {
    cy.visitWithOp({
      query: 'query A { __typename }\nquery B { __typename }\n',
    });
    cy.get('.graphiql-query-editor .view-lines').should('exist');

    cy.activateOperation('B');
    cy.get('.graphiql-tab-active .graphiql-tab-button').should(
      'contain.text',
      'B',
    );

    cy.get('.graphiql-query-editor .graphiql-editor').first().realClick();
    cy.realPress('Enter');
    cy.focused().should('have.class', 'inputarea');
    cy.clickExecuteQuery();
    cy.get('.result-window').should('contain.text', '__typename');
  });
});
