describe('Tabs', () => {
  it('Should store editor contents when switching between tabs', () => {
    cy.visit('/?query=');
    cy.get('#session-tab-0').should('have.text', '<untitled>');

    // Enter a query without operation name
    cy.get('.graphiql-query-editor textarea')
      .type('{id', { force: true })
      .wait(500);
    cy.get('#session-tab-0').should('have.text', '<untitled>');

    // Run the query
    cy.get('.execute-button').click().wait(500);

    // Open a new tab
    cy.get('.tab-add').click();

    // Enter a query
    cy.get('.graphiql-query-editor textarea')
      .type('query Foo {image', { force: true })
      .wait(500);
    cy.get('#session-tab-1').should('have.text', 'Foo');

    // Enter variables
    cy.get('.graphiql-editor-tool textarea')
      .eq(0)
      .type('{"someVar":42', { force: true });

    // Enter headers
    cy.contains('Headers').click();
    cy.get('.graphiql-editor-tool textarea')
      .eq(1)
      .type('{"someHeader":"someValue"', { force: true });

    // Run the query
    cy.get('.execute-button').click().wait(500);

    // Switch back to the first tab
    cy.get('#session-tab-0').click();

    // Assert tab titles
    cy.get('#session-tab-0').should('have.text', '<untitled>');
    cy.get('#session-tab-1').should('have.text', 'Foo');

    // Assert editor values
    cy.assertHasValues({
      query: '{id}',
      variablesString: '',
      headersString: '',
      response: { data: { id: 'abc123' } },
    });

    // Switch back to the second tab
    cy.get('#session-tab-1').click();

    // Assert tab titles
    cy.get('#session-tab-0').should('have.text', '<untitled>');
    cy.get('#session-tab-1').should('have.text', 'Foo');

    // Assert editor values
    cy.assertHasValues({
      query: 'query Foo {image}',
      variablesString: '{"someVar":42}',
      headersString: '{"someHeader":"someValue"}',
      response: { data: { image: '/images/logo.svg' } },
    });

    // Close tab
    cy.get('#session-tab-1 .close').click();

    // Assert tab titles
    cy.get('#session-tab-0').should('have.text', '<untitled>');

    // Assert editor values
    cy.assertHasValues({
      query: '{id}',
      variablesString: '',
      headersString: '',
      response: { data: { id: 'abc123' } },
    });
  });
});
