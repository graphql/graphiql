describe('Theme', () => {
  describe('`forcedTheme`', () => {
    it('Switches to light theme when `forcedTheme` is light', () => {
      cy.visit('/?forcedTheme=light');
      cy.get('body').should('have.class', 'graphiql-light');
    });

    it('Switches to dark theme when `forcedTheme` is dark', () => {
      cy.visit('/?forcedTheme=dark');
      cy.get('body').should('have.class', 'graphiql-dark');
    });

    it('Defaults to light theme when `forcedTheme` value is invalid', () => {
      cy.visit('/?forcedTheme=invalid');
      cy.get('[data-value=settings]').click();
      cy.get('.graphiql-dialog-section-title')
        .eq(1)
        .should('have.text', 'Theme'); // Check for the presence of the theme dialog
    });
  });

  describe('`defaultTheme`', () => {
    it('should have light theme', () => {
      cy.visit('/?defaultTheme=light');
      cy.get('body').should('have.class', 'graphiql-light');
    });
    it('should have dark theme', () => {
      cy.visit('/?defaultTheme=dark');
      cy.get('body').should('have.class', 'graphiql-dark');
    });
  });
});
