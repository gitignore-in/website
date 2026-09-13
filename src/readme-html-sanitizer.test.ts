import { expect, test } from 'bun:test'

import { sanitizeReadmeHtmlTree } from './readme-html-sanitizer'
import {
  upstreamReadmeCommit,
  upstreamRepoName,
  upstreamRepoOwner,
} from './upstream-readme-source'

test('sanitizes unsafe raw html while preserving safe content', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'p',
        children: [
          { type: 'text', value: 'Hello' },
          {
            type: 'element',
            tagName: 'script',
            children: [{ type: 'text', value: 'alert(1)' }],
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { onclick: 'alert(2)' },
            children: [{ type: 'text', value: 'world' }],
          },
        ],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          alt: 'concept',
          src: 'https://example.com/concept.png',
          onerror: 'alert(3)',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: 'javascript:alert(4)',
          title: 'unsafe link',
        },
        children: [{ type: 'text', value: 'click' }],
      },
    ],
  })

  expect(tree.children).toHaveLength(3)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'p',
  })
  expect(tree.children[0].children).toHaveLength(2)
  expect(tree.children[0].children?.[0]).toMatchObject({
    type: 'text',
    value: 'Hello',
  })
  expect(tree.children[0].children?.[1]).toMatchObject({
    type: 'element',
    tagName: 'span',
    properties: {},
    children: [{ type: 'text', value: 'world' }],
  })
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      alt: 'concept',
      src: 'https://example.com/concept.png',
    },
  })
  expect(tree.children[2]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      title: 'unsafe link',
    },
    children: [{ type: 'text', value: 'click' }],
  })
})

test('covers sanitizer edge cases for empty and partial properties', () => {
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

  expect(tree.children).toHaveLength(3)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'p',
    children: [{ type: 'text', value: 'plain paragraph' }],
  })
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: 'https://example.com',
      target: '_self',
    },
  })
  expect(tree.children[1].properties).not.toHaveProperty('rel')
  expect(tree.children[2]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      alt: 'broken',
    },
  })
})

test('keeps safe urls and adds rel on target blank links', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: 'https://example.com/path?q=1',
          target: '_blank',
        },
        children: [{ type: 'text', value: 'example' }],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          src: '/images/concept.png',
          alt: 'concept',
        },
        children: [],
      },
    ],
  })

  expect(tree.children).toHaveLength(2)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: 'https://example.com/path?q=1',
      target: '_blank',
      rel: 'noreferrer noopener',
    },
  })
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      src: '/images/concept.png',
      alt: 'concept',
    },
  })
})

test('rewrites repo-relative README links to the upstream repo', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: './LICENSE',
        },
        children: [{ type: 'text', value: 'license' }],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: './docs/usage.md#install',
        },
        children: [{ type: 'text', value: 'usage' }],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          src: './assets/concept.png',
          alt: 'concept',
        },
        children: [],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: '/pages/subpage',
        },
        children: [{ type: 'text', value: 'site page' }],
      },
    ],
  })

  expect(tree.children).toHaveLength(4)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: `https://github.com/gitignore-in/gitignore-in/blob/${upstreamReadmeCommit}/LICENSE`,
    },
  })
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: `https://github.com/gitignore-in/gitignore-in/blob/${upstreamReadmeCommit}/docs/usage.md#install`,
    },
  })
  expect(tree.children[2]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      alt: 'concept',
      src: `https://raw.githubusercontent.com/gitignore-in/gitignore-in/${upstreamReadmeCommit}/assets/concept.png`,
    },
  })
  expect(tree.children[3]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: '/pages/subpage',
    },
  })
})

test('drops repo-relative URLs that escape above the upstream repo root', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: {
          href: '../CHANGELOG.md',
          title: 'outside root',
        },
        children: [{ type: 'text', value: 'changelog' }],
      },
    ],
  })

  expect(tree.children).toHaveLength(1)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      title: 'outside root',
    },
  })
  expect(tree.children[0].properties).not.toHaveProperty('href')
})

test('rejects malformed image urls containing spaces', () => {
  const tree = sanitizeReadmeHtmlTree({
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
    ],
  })

  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      alt: 'broken url',
    },
    children: [],
  })
})

test('throws when called with non-root element input', () => {
  expect(() =>
    sanitizeReadmeHtmlTree({
      type: 'element',
      tagName: 'div',
      children: [],
    } as never),
  ).toThrow('sanitizeReadmeHtmlTree expected a root node')
})

test('drops forbidden elements and unwraps unknown containers', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'div',
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
        tagName: 'custom-element',
        children: [{ type: 'text', value: 'kept' }],
      },
    ],
  })

  expect(tree.children).toHaveLength(2)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'div',
    children: [
      { type: 'text', value: 'before' },
      { type: 'text', value: 'after' },
    ],
  })
  expect(tree.children[1]).toMatchObject({ type: 'text', value: 'kept' })
})

test('preserves non-element nodes and sanitizes their child arrays', () => {
  expect(
    sanitizeReadmeHtmlTree({
      type: 'text',
      value: 'plain text node',
    } as never),
  ).toEqual({
    type: 'text',
    value: 'plain text node',
  })

  expect(
    sanitizeReadmeHtmlTree({
      type: 'text',
      children: [
        { type: 'text', value: 'before' },
        { type: 'element', tagName: 'script', children: [] },
        { type: 'text', value: 'after' },
      ],
    } as never),
  ).toEqual({
    type: 'text',
    children: [
      { type: 'text', value: 'before' },
      { type: 'text', value: 'after' },
    ],
  })
})

test('normalizes tag casing and url safety edge cases', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'A',
        properties: {
          HREF: '  https://example.com/path  ',
          TARGET: '_blank',
          ONCLICK: 'alert(1)',
        },
        children: [{ type: 'text', value: 'link' }],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          SRC: 'ftp://example.com/bad.png',
          ALT: 'forbidden protocol',
        },
        children: [],
      },
      { type: 'text', value: 'before' },
      'raw-node',
    ],
  })

  expect(tree.children).toHaveLength(4)
  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'A',
    properties: {
      HREF: 'https://example.com/path',
      TARGET: '_blank',
      rel: 'noreferrer noopener',
    },
  })
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      ALT: 'forbidden protocol',
    },
    children: [],
  })
  expect(tree.children[2]).toMatchObject({ type: 'text', value: 'before' })
  expect(tree.children[3]).toEqual('raw-node')
})

test('rewrites repo-root-relative README links to the upstream GitHub repo', () => {
  const tree = sanitizeReadmeHtmlTree({
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: { href: './LICENSE' },
        children: [{ type: 'text', value: 'LICENSE' }],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: { href: './sub/../file.md#section' },
        children: [{ type: 'text', value: 'section' }],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: { src: './concept.png', alt: 'concept' },
        children: [],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: { href: '/pages/subpage' },
        children: [{ type: 'text', value: 'site page' }],
      },
      {
        type: 'element',
        tagName: 'a',
        properties: { href: '../escapes-repo-root.md' },
        children: [{ type: 'text', value: 'escapes' }],
      },
    ],
  })

  expect(tree.children[0]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: `https://github.com/${upstreamRepoOwner}/${upstreamRepoName}/blob/${upstreamReadmeCommit}/LICENSE`,
    },
  })
  // A `../` that stays within the repo (backing out of a directory the
  // link itself descended into) still resolves against the pinned commit —
  // the commit segment is never dropped.
  expect(tree.children[1]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {
      href: `https://github.com/${upstreamRepoOwner}/${upstreamRepoName}/blob/${upstreamReadmeCommit}/file.md#section`,
    },
  })
  expect(tree.children[2]).toMatchObject({
    type: 'element',
    tagName: 'img',
    properties: {
      src: `https://raw.githubusercontent.com/${upstreamRepoOwner}/${upstreamRepoName}/${upstreamReadmeCommit}/concept.png`,
      alt: 'concept',
    },
  })
  // Site-root-relative paths (e.g. links to this site itself) are left as-is.
  expect(tree.children[3]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: { href: '/pages/subpage' },
  })
  // README.md lives at the upstream repo root, so a `..` that climbs above
  // it has nothing valid to resolve to and must be dropped, not turned into
  // a ref-less, broken GitHub URL.
  expect(tree.children[4]).toMatchObject({
    type: 'element',
    tagName: 'a',
    properties: {},
  })
  expect(tree.children[4].properties?.href).toBeUndefined()
})
