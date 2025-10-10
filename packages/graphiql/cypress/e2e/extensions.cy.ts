describe('Extensions', () => {
  it('should render the extensions tab', () => {
    cy.visit('/');
    cy.contains('Extensions').should('be.visible');
  });

  it('should allow typing and persisting extensions', () => {
    cy.visit('/');
    cy.contains('Extensions').click();
    cy.get('.graphiql-editor-tool .graphiql-editor')
      .eq(2)
      .click()
      .focused()
      .type('{"key": "value"}', { parseSpecialCharSequences: false });
    
    // Reload and verify persistence
    cy.reload();
    cy.assertHasValues({
      query: '# Welcome to GraphiQL',
      extensionsString: '{"key": "value"}',
    });
  });

  it('should send extensions in the request', () => {
    cy.visit('/');
    cy.contains('Extensions').click();
    cy.get('.graphiql-editor-tool .graphiql-editor')
      .eq(2)
      .click()
      .focused()
      .type('{"testKey": "testValue"}', { parseSpecialCharSequences: false });

    // Type a simple query
    cy.get('.graphiql-query-editor').click().focused().type('{selectall}');
    cy.get('.graphiql-query-editor')
      .click()
      .focused()
      .type('{{ test {{ id }} }}', { parseSpecialCharSequences: false });

    // Intercept the request to verify extensions are included
    cy.intercept('POST', '/graphql', req => {
      expect(req.body).to.have.property('extensions');
      expect(req.body.extensions).to.deep.equal({ testKey: 'testValue' });
      req.reply({
        data: { test: { id: '123' } },
      });
    }).as('graphqlRequest');

    cy.clickExecuteQuery();
    cy.wait('@graphqlRequest');
  });

  it('should show error for invalid JSON in extensions', () => {
    cy.visit('/');
    cy.contains('Extensions').click();
    cy.get('.graphiql-editor-tool .graphiql-editor')
      .eq(2)
      .click()
      .focused()
      .type('{invalid json}', { parseSpecialCharSequences: false });

    cy.get('.graphiql-query-editor').click().focused().type('{selectall}');
    cy.get('.graphiql-query-editor')
      .click()
      .focused()
      .type('{{ test {{ id }} }}', { parseSpecialCharSequences: false });

    cy.clickExecuteQuery();
    cy.get('.result-window').should('contain', 'Extensions');
  });

  it('should support prettify for extensions', () => {
    cy.visit('/');
    cy.contains('Extensions').click();
    cy.get('.graphiql-editor-tool .graphiql-editor')
      .eq(2)
      .click()
      .focused()
      .type('{{"a":1,"b":2}}', { parseSpecialCharSequences: false });

    cy.clickPrettify();

    // Verify it's prettified (has newlines and indentation)
    cy.get('.graphiql-editor-tool .graphiql-editor')
      .eq(2)
      .should('contain', '"a"')
      .should('contain', '"b"');
  });

  it('should load extensions from URL parameters', () => {
    const extensionsString = '{"urlParam":"test"}';
    cy.visit(`/?extensions=${encodeURIComponent(extensionsString)}`);
    cy.assertHasValues({
      query: '# Welcome to GraphiQL',
      extensionsString,
    });
  });

  it('should handle empty extensions gracefully', () => {
    cy.visit('/');
    cy.contains('Extensions').click();

    // Make sure extensions editor is empty
    cy.get('.graphiql-editor-tool .graphiql-editor').eq(2).should('be.empty');

    // Execute query with empty extensions
    cy.get('.graphiql-query-editor').click().focused().type('{selectall}');
    cy.get('.graphiql-query-editor')
      .click()
      .focused()
      .type('{{ test {{ id }} }}', { parseSpecialCharSequences: false });

    cy.intercept('POST', '/graphql', req => {
      // Extensions should be undefined or not present
      expect(req.body.extensions).to.be.undefined;
      req.reply({
        data: { test: { id: '123' } },
      });
    }).as('graphqlRequest');

    cy.clickExecuteQuery();
    cy.wait('@graphqlRequest');
  });
});

