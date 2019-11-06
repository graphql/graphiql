const prettifiedQuery = `{
  longDescriptionType {
    id
  }
}
`;

const prettifiedVariables = `{
  "a": 1
}`;

const uglyQuery = `{longDescriptionType {id}}`;

const uglyVaribles = `{"a": 1}`;

const brokenQuery = `longDescriptionType {id}}`;

const brokenVaribles = `"a": 1}`;

describe('GraphiQL Prettify', function() {
  it('Regular prettification', function() {
    cy.visit(`/?query=${encodeURIComponent(uglyQuery)}&variables=${encodeURIComponent(uglyVaribles)}`);

    cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();

    cy.window().then((w) => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(prettifiedVariables);
    })
  }) 

  it('Noop prettification', function() {
    cy.visit(`/?query=${encodeURIComponent(prettifiedQuery)}&variables=${encodeURIComponent(prettifiedVariables)}`);

    cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();

    cy.window().then((w) => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(prettifiedVariables);
    })
  }) 
  
  it('No crash on bad query', function() {
    cy.visit(`/?query=${encodeURIComponent(brokenQuery)}&variables=${encodeURIComponent(uglyVaribles)}`);

    cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();

    cy.window().then((w) => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(brokenQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(prettifiedVariables);
    })
  }) 

  it('No crash on bad variables', function() {
    cy.visit(`/?query=${encodeURIComponent(uglyQuery)}&variables=${encodeURIComponent(brokenVaribles)}`);

    cy.get('[title="Prettify Query (Shift-Ctrl-P)"]').click();

    cy.window().then((w) => {
      cy.expect(w.g.getQueryEditor().getValue()).to.equal(prettifiedQuery);
      cy.expect(w.g.getVariableEditor().getValue()).to.equal(brokenVaribles);
    })
  }) 
})
