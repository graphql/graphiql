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
});
