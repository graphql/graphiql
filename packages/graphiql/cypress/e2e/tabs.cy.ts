describe('Tabs', () => {
  it('Should store editor contents when switching between tabs', () => {
    let count = 0;

    cy.on('window:confirm', str => {
      count += 1;
      switch (count) {
        case 1:
          expect(str).to.eq('Are you sure you want to close this tab?');
          // reject the initial attempt to close the tab
          return false;
        case 2:
          expect(str).to.eq('Are you sure you want to close this tab?');
          // approve the second attempt to close the tab
          return true;
        default:
          return true;
      }
    });

    cy.visit('/?query=');

    // Assert that no tab visible when there's only one session
    cy.get('#graphiql-session-tab-0').should('not.exist');

    // Enter a query without operation name
    cy.get('.graphiql-query-editor textarea').type('{id', { force: true });

    // Run the query
    cy.clickExecuteQuery();

    // Open a new tab
    cy.get('.graphiql-tab-add').click();

    // Enter a query
    cy.get('.graphiql-query-editor textarea').type('query Foo {image', {
      force: true,
    });
    cy.get('#graphiql-session-tab-1').should('have.text', 'Foo');

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
    cy.clickExecuteQuery();

    // Switch back to the first tab
    cy.get('#graphiql-session-tab-0').click();

    // Assert tab titles
    cy.get('#graphiql-session-tab-0').should('have.text', '<untitled>');
    cy.get('#graphiql-session-tab-1').should('have.text', 'Foo');

    // Assert editor values
    cy.assertHasValues({
      query: '{id}',
      variablesString: '',
      headersString: '',
      response: { data: { id: 'abc123' } },
    });

    // Switch back to the second tab
    cy.get('#graphiql-session-tab-1').click();

    // Assert tab titles
    cy.get('#graphiql-session-tab-0').should('have.text', '<untitled>');
    cy.get('#graphiql-session-tab-1').should('have.text', 'Foo');

    // Assert editor values
    cy.assertHasValues({
      query: 'query Foo {image}',
      variablesString: '{"someVar":42}',
      headersString: '{"someHeader":"someValue"}',
      response: { data: { image: '/images/logo.svg' } },
    });

    // Close tab (this will get rejected)
    cy.get('#graphiql-session-tab-1 + .graphiql-tab-close').click();

    // Tab is still visible
    cy.get('#graphiql-session-tab-1 + .graphiql-tab-close').should('exist');

    // Close tab (this will get accepted)
    cy.get('#graphiql-session-tab-1 + .graphiql-tab-close').click();

    // Assert that no tab visible when there's only one session
    cy.get('#graphiql-session-tab-0').should('not.exist');

    // Assert editor values
    cy.assertHasValues({
      query: '{id}',
      variablesString: '',
      headersString: '',
      response: { data: { id: 'abc123' } },
    });
  });
});
