import { expect, test } from 'bun:test'

import { sanitizeReadmeHtmlTree } from '../src/readme-html-sanitizer'
import {
  checkReadmeSync,
  sourceUrl,
  upstreamReadmeCommit,
} from './check-readme-sync'

test('fetches the pinned upstream README URL', async () => {
  await checkReadmeSync(
    async (input) => {
      expect(input).toBe(sourceUrl)
      return new Response('readme')
    },
    async () => 'readme',
  )
})

test('reports the pinned upstream commit when fetch rejects', async () => {
  await expect(
    checkReadmeSync(
      async () => {
        throw new Error('offline')
      },
      async () => 'readme',
    ),
  ).rejects.toThrow(
    `Failed to fetch upstream README at ${upstreamReadmeCommit}: Error: offline`,
  )
})

test('reports an empty upstream body as a fetch failure', async () => {
  await expect(
    checkReadmeSync(
      async () => new Response(''),
      async () => 'readme',
    ),
  ).rejects.toThrow(
    `Failed to fetch upstream README at ${upstreamReadmeCommit}: response body was empty`,
  )
})

test('reports upstream body read failures before comparing content', async () => {
  const response = new Response('readme')
  response.text = async () => {
    throw new Error('stream interrupted')
  }

  await expect(
    checkReadmeSync(
      async () => response,
      async () => 'readme',
    ),
  ).rejects.toThrow(
    `Failed to read upstream README at ${upstreamReadmeCommit}: Error: stream interrupted`,
  )
})

test('reports local README missing with restoration guidance', async () => {
  await expect(
    checkReadmeSync(
      async () => new Response('readme'),
      async () => {
        const error = new Error('missing')
        ;(error as NodeJS.ErrnoException).code = 'ENOENT'
        throw error
      },
    ),
  ).rejects.toThrow(
    'src/readme.md not found; run `git checkout src/readme.md` to restore',
  )
})

test('reports fetch timeouts with upstream context', async () => {
  await expect(
    checkReadmeSync(
      async () => {
        throw new Error('The operation was aborted.')
      },
      async () => 'readme',
    ),
  ).rejects.toThrow(
    `Failed to fetch upstream README at ${upstreamReadmeCommit}: Error: The operation was aborted.`,
  )
})

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
      alt: 'forbidden protocol',
    },
  })
  expect(tree.children[2]).toMatchObject({ type: 'text', value: 'before' })
  expect(tree.children[3]).toEqual('raw-node')
})
