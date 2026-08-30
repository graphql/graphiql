describe('Theme', () => {
  describe('`defaultTheme`', () => {
    it('should have light theme', () => {
      cy.visit('?defaultTheme=light');
      cy.get('body').should('have.class', 'graphiql-light');
    });
    it('should have dark theme', () => {
      cy.visit('?defaultTheme=dark');
      cy.get('body').should('have.class', 'graphiql-dark');
    });
  });

  describe('Settings theme toggle', () => {
    function editorBackground() {
      return cy
        .get('.graphiql-editors')
        .then($el => getComputedStyle($el[0]).backgroundColor);
    }

    function openSettingsAndChooseTheme(theme: 'light' | 'dark') {
      cy.get('[aria-label="Settings"]').click();
      cy.get('.graphiql-dialog').should('be.visible');
      // The radio input itself is visually hidden (a custom-styled control),
      // so `check` is the reliable way to select it.
      cy.get(`input[type="radio"][value="${theme}"]`).check({ force: true });
      cy.get(`input[type="radio"][value="${theme}"]`).should('be.checked');
      // Assert the effect landed while the dialog is still open, before
      // closing it — closing and immediately reopening the dialog for the
      // next toggle races with Radix's dismiss/focus-return handling.
      cy.get('.graphiql-container').should('have.attr', 'data-theme', theme);
      cy.get('.graphiql-dialog-close').click();
      cy.get('.graphiql-dialog').should('not.exist');
    }

    beforeEach(() => {
      // The theme setting persists to localStorage and defaults to 'auto',
      // which depends on the OS color-scheme preference. Start every test
      // from an explicit, deterministic Dark baseline instead of inheriting
      // whatever the previous test (or the test runner's OS) prefers.
      cy.clearLocalStorage();
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            'graphiql:settings',
            JSON.stringify({ theme: 'dark' }),
          );
        },
      });
      cy.get('.graphiql-container').should('have.attr', 'data-theme', 'dark');
    });

    it('recolors the editor background, not just the syntax tokens, when switching to Light', () => {
      editorBackground().then(darkBackground => {
        openSettingsAndChooseTheme('light');

        // The bug this guards against: only the Monaco syntax tokens used to
        // recolor on toggle while `.graphiql-editors` kept its dark
        // background, because it was still painted by a legacy token that
        // the Settings-driven `data-theme` toggle never updated.
        editorBackground().should('not.equal', darkBackground);
      });
    });

    it('restores the dark editor background when switching back to Dark', () => {
      editorBackground().then(originalDarkBackground => {
        openSettingsAndChooseTheme('light');
        openSettingsAndChooseTheme('dark');

        editorBackground().should('equal', originalDarkBackground);
      });
    });
  });
});
