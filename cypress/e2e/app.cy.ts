import { sanitizeReadmeHtmlTree } from '../../src/readme-html-sanitizer'

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

  it('should sanitize trusted and untrusted readme html nodes', () => {
    const tree = sanitizeReadmeHtmlTree({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [
            { type: 'text', value: 'before' },
            {
              type: 'element',
              tagName: 'script',
              children: [{ type: 'text', value: 'alert(1)' }],
            },
            { type: 'text', value: 'after' },
          ],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: {
            href: 'javascript:alert(1)',
            target: '_blank',
          },
          children: [{ type: 'text', value: 'unsafe link' }],
        },
        {
          type: 'text',
          children: [
            { type: 'text', value: 'nested text' },
            {
              type: 'element',
              tagName: 'custom-element',
              children: [{ type: 'text', value: 'kept' }],
            },
          ],
        },
      ],
    })

    expect(tree.children).to.have.length(3)
    expect(tree.children[0]).to.deep.include({
      type: 'element',
      tagName: 'p',
    })
    expect(tree.children[0].children).to.have.length(2)
    expect(tree.children[0].children[0]).to.deep.include({
      type: 'text',
      value: 'before',
    })
    expect(tree.children[0].children[1]).to.deep.include({
      type: 'text',
      value: 'after',
    })
    expect(tree.children[1]).to.deep.include({
      type: 'element',
      tagName: 'a',
      properties: {
        target: '_blank',
        rel: 'noreferrer noopener',
      },
    })
    expect(tree.children[2]).to.deep.include({
      type: 'text',
      children: [
        { type: 'text', value: 'nested text' },
        { type: 'text', value: 'kept' },
      ],
    })
  })

  it('should sanitize edge-case properties without adding unsafe attributes', () => {
    const tree = sanitizeReadmeHtmlTree({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          children: [{ type: 'text', value: 'plain paragraph' }],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: {
            href: 'https://example.com',
            target: '_self',
            onClick: 'alert(1)',
            'data-test': 'ignored',
          },
          children: [{ type: 'text', value: 'link' }],
        },
        {
          type: 'element',
          tagName: 'img',
          properties: {
            src: 42,
            alt: 'broken',
          },
          children: [],
        },
      ],
    })

    expect(tree.children).to.have.length(3)
    expect(tree.children[0]).to.deep.include({
      type: 'element',
      tagName: 'p',
    })
    expect(tree.children[1]).to.deep.include({
      type: 'element',
      tagName: 'a',
      properties: {
        href: 'https://example.com',
        target: '_self',
      },
    })
    expect(tree.children[1].properties).not.to.have.property('rel')
    expect(tree.children[2]).to.deep.include({
      type: 'element',
      tagName: 'img',
      properties: {
        alt: 'broken',
      },
    })
  })
})
