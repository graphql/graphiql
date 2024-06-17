describe('Theme', () => {
  it('Switches to light theme when `forcedTheme` is light', () => {
    cy.visit('/?query={test}&forcedTheme=light');
    cy.get('body').should('have.class', 'graphiql-light');
  });

  it('Switches to dark theme when `forcedTheme` is dark', () => {
    cy.visit('/?query={test}&forcedTheme=dark');
    cy.get('body').should('have.class', 'graphiql-dark');
  });

  it('Defaults to light theme when `forcedTheme` value is invalid', () => {
    cy.visit('/?query={test}&forcedTheme=invalid');
    cy.get('[data-value=settings]').click();
    cy.get('.graphiql-dialog-section-title').eq(1).should('have.text', 'Theme'); // Check for the presence of the theme dialog
  });
});
