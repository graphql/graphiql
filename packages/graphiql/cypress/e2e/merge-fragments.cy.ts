describe('GraphiQL Merge Fragments', () => {
  it('merges a fragment into the operation when clicked', () => {
    const query = `fragment IdFragment on Test {
  id
}

query TestQuery {
  ...IdFragment
}`;

    cy.visitWithOp({ query });
    cy.clickMergeFragments();

    cy.get(
      '.graphiql-query-editor .view-lines.monaco-mouse-cursor-text',
    ).should(element => {
      const text = element.get(0).innerText;
      expect(text).to.not.contain('fragment IdFragment');
      expect(text).to.not.contain('...IdFragment');
      expect(text).to.contain('id');
    });
  });
});
