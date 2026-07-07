describe('App Home', () => {
  it('should render the home page', () => {
    cy.visit('/')
    cy.contains('h1', 'gitignore.in')
    cy.contains('h2', 'Motivation')
    cy.contains('h2', 'Solution')
    cy.get('img[alt="concept"]')
      .should('have.attr', 'src')
      .and('include', 'github.com/gitignore-in/gitignore-in/assets')
  })

  it('should serve the SVG favicon', () => {
    cy.request('/favicon.svg').its('status').should('eq', 200)
    cy.visit('/')
    cy.get('link[rel="icon"]')
      .should('have.attr', 'type', 'image/svg+xml')
      // Vite's `base: './'` rewrites the built link href to a relative path.
      .and('have.attr', 'href', './favicon.svg')
  })
})
