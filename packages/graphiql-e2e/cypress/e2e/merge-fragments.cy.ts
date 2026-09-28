describe('GraphiQL Merge Fragments', () => {
  it('merges a fragment into the operation when clicked', () => {
    const query = `fragment IdFragment on Test {
  id
}

query TestQuery {
  ...IdFragment
}`;

    cy.visitGraphiQL({ query });
    cy.clickMergeFragments();

    cy.getEditorModel().should(model => {
      const text = model.getValue();
      expect(text).to.not.contain('fragment IdFragment');
      expect(text).to.not.contain('...IdFragment');
      expect(text).to.contain('id');
    });
  });
});
