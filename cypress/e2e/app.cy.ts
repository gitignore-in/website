describe('App Home', () => {
  it('should render the home page', () => {
    cy.visit('http://localhost:3000')
    cy.contains('h1', 'gitignore.in')
    cy.contains('h2', 'Motivation')
    cy.contains('h2', 'Solution')
    cy.get('img[alt="concept"]')
      .should('have.attr', 'src')
      .and('include', 'github.com/gitignore-in/gitignore-in/assets')
  })
})
