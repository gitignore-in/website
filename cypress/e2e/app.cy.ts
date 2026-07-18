type SanitizeTree = (tree: unknown) => unknown
type SanitizedTree = {
  children?: unknown[]
  properties?: Record<string, unknown>
}

function sanitizeInBrowser(tree: unknown) {
  return cy
    .visit('/')
    .window()
    .then((window) => {
      const sanitizeReadmeHtmlTree = (
        window as Window & {
          __readmeSanitizerTestHooks: {
            sanitizeReadmeHtmlTree: SanitizeTree
          }
        }
      ).__readmeSanitizerTestHooks.sanitizeReadmeHtmlTree

      return sanitizeReadmeHtmlTree(tree)
    })
}

describe('App Home', () => {
  it('should render the home page', () => {
    cy.visit('/')
    cy.contains('h1', 'gitignore.in')
    cy.contains('h2', 'Motivation')
    cy.contains('h2', 'Solution')
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
    sanitizeInBrowser({
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
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: assertion-heavy coverage probe.
    }).then((tree) => {
      const sanitizedTree = tree as SanitizedTree
      expect(sanitizedTree.children).to.have.length(3)
      expect(sanitizedTree.children?.[0]).to.deep.include({
        type: 'element',
        tagName: 'p',
      })
      expect(
        (sanitizedTree.children?.[0] as SanitizedTree).children,
      ).to.have.length(2)
      expect(
        ((sanitizedTree.children?.[0] as SanitizedTree).children ?? [])[0],
      ).to.deep.include({
        type: 'text',
        value: 'before',
      })
      expect(
        ((sanitizedTree.children?.[0] as SanitizedTree).children ?? [])[1],
      ).to.deep.include({
        type: 'text',
        value: 'after',
      })
      expect(sanitizedTree.children?.[1]).to.deep.include({
        type: 'element',
        tagName: 'a',
        properties: {
          target: '_blank',
          rel: 'noreferrer noopener',
        },
      })
      expect(sanitizedTree.children?.[2]).to.deep.include({
        type: 'text',
        children: [
          { type: 'text', value: 'nested text' },
          { type: 'text', value: 'kept' },
        ],
      })
    })
  })

  it('should sanitize edge-case properties without adding unsafe attributes', () => {
    sanitizeInBrowser({
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
    }).then((tree) => {
      const sanitizedTree = tree as SanitizedTree
      expect(sanitizedTree.children).to.have.length(3)
      expect(sanitizedTree.children?.[0]).to.deep.include({
        type: 'element',
        tagName: 'p',
      })
      expect(sanitizedTree.children?.[1]).to.deep.include({
        type: 'element',
        tagName: 'a',
        properties: {
          href: 'https://example.com',
          target: '_self',
        },
      })
      expect(
        (sanitizedTree.children?.[1] as SanitizedTree).properties,
      ).not.to.have.property('rel')
      expect(sanitizedTree.children?.[2]).to.deep.include({
        type: 'element',
        tagName: 'img',
        properties: {
          alt: 'broken',
        },
      })
    })
  })

  it('should reject malformed urls, empty children, and non-root sanitizer inputs', () => {
    sanitizeInBrowser({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'img',
          properties: {
            src: 'https://exa mple.com/bad.png',
            alt: 'broken url',
          },
        },
        {
          type: 'element',
          tagName: 'div',
        },
        'plain text child' as never,
      ],
    }).then((tree) => {
      const sanitizedTree = tree as SanitizedTree
      expect(sanitizedTree.children).to.deep.equal([
        {
          type: 'element',
          tagName: 'img',
          properties: {
            alt: 'broken url',
          },
          children: [],
        },
        {
          type: 'element',
          tagName: 'div',
          properties: undefined,
          children: [],
        },
        'plain text child',
      ])
    })

    cy.visit('/')
      .window()
      .then((window) => {
        const sanitizeReadmeHtmlTree = (
          window as Window & {
            __readmeSanitizerTestHooks: {
              sanitizeReadmeHtmlTree: SanitizeTree
            }
          }
        ).__readmeSanitizerTestHooks.sanitizeReadmeHtmlTree

        expect(() =>
          sanitizeReadmeHtmlTree({
            type: 'element',
            tagName: 'div',
            children: [],
          }),
        ).to.throw('sanitizeReadmeHtmlTree expected a root node')
      })
  })

  it('should drop forbidden tags and unwrap unsupported containers in browser coverage', () => {
    sanitizeInBrowser({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'custom-element',
          children: [
            { type: 'text', value: 'kept text' },
            {
              type: 'element',
              tagName: 'script',
              children: [{ type: 'text', value: 'drop me' }],
            },
          ],
        },
        {
          type: 'text',
          value: 'wrapper',
          children: [
            { type: 'text', value: 'nested text' },
            {
              type: 'element',
              tagName: 'span',
              children: [{ type: 'text', value: 'nested span' }],
            },
          ],
        },
        'literal child' as never,
      ],
    }).then((tree) => {
      const sanitizedTree = tree as SanitizedTree
      expect(sanitizedTree.children).to.deep.equal([
        { type: 'text', value: 'kept text' },
        {
          type: 'text',
          value: 'wrapper',
          children: [
            { type: 'text', value: 'nested text' },
            {
              type: 'element',
              tagName: 'span',
              properties: undefined,
              children: [{ type: 'text', value: 'nested span' }],
            },
          ],
        },
        'literal child',
      ])
    })

    sanitizeInBrowser({
      type: 'root',
      children: [{ type: 'element', tagName: 'script', children: [] }],
    }).then((tree) => {
      expect(tree).to.deep.equal({
        type: 'root',
        children: [],
      })
    })
  })
})
