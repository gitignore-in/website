describe('App Home', () => {
  it('should render the home page', () => {
    cy.visit('http://localhost:3000')
    cy.contains('gitignore.in')
  })
})
