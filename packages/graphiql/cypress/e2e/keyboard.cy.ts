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

    cy.get('.graphiql-query-editor textarea').type('{esc}', { force: true });

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

    cy.get('.graphiql-query-editor textarea')
      .type('{\n  t', { force: true })
      .type('{esc}');

    cy.get('@escapeHandler').should('not.have.been.called');
  });
});
