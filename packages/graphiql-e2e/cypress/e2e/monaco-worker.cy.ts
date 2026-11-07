describe('Monaco GraphQL worker', () => {
  it('provides diagnostics, completion, and hover over worker RPC', () => {
    cy.visitGraphiQL({ query: '{ doesNotExist }' }).assertLinterMarkWithMessage(
      'doesNotExist',
      'error',
      'Cannot query field "doesNotExist" on type "Test".',
    );

    cy.window().then(win => {
      const model = win.__MONACO.editor
        .getModels()
        .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
      const codeEditor = win.__MONACO.editor
        .getEditors()
        .find(candidate => candidate.getModel() === model)!;

      model.setValue('{\n  \n}');
      codeEditor.setPosition({ lineNumber: 2, column: 3 });
      codeEditor.focus();
      codeEditor.trigger('test', 'editor.action.triggerSuggest', {});
    });

    cy.get('.suggest-widget')
      .should('be.visible')
      .find('.monaco-list-row')
      .contains('id');

    cy.window().then(win => {
      const model = win.__MONACO.editor
        .getModels()
        .find(candidate => candidate.uri.path.endsWith('operation.graphql'))!;
      const codeEditor = win.__MONACO.editor
        .getEditors()
        .find(candidate => candidate.getModel() === model)!;

      codeEditor.trigger('test', 'editor.action.hideHover', {});
      model.setValue('{ id }');
      codeEditor.setPosition({ lineNumber: 1, column: 4 });
      codeEditor.focus();
      codeEditor.trigger('test', 'editor.action.showHover', {});
    });

    cy.get('.monaco-hover')
      .should('be.visible')
      .and('contain.text', 'id field from Test type.');
  });
});
