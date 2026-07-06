import { expect, test } from 'bun:test'

import { sanitizeNode } from './rehype-sanitize'

test('keeps the concept image and strips unsafe attributes', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'p',
        properties: {},
        children: [{ type: 'text', value: 'Hello' }],
      },
      {
        type: 'element',
        tagName: 'img',
        properties: {
          alt: 'concept',
          onload: 'alert(1)',
          src: 'https://example.com/concept.png',
          style: 'width: 100%',
          width: '735',
        },
        children: [],
      },
    ],
  }

  const sanitized = sanitizeNode(tree)

  expect(sanitized).not.toBeNull()
  expect(sanitized?.children).toHaveLength(2)
  expect(sanitized?.children?.[1]).toMatchObject({
    tagName: 'img',
    properties: {
      alt: 'concept',
      src: 'https://example.com/concept.png',
      width: '735',
    },
  })
})

test('drops unsafe raw html nodes entirely', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'script',
        properties: {},
        children: [{ type: 'text', value: 'alert(1)' }],
      },
    ],
  }

  const sanitized = sanitizeNode(tree)

  expect(sanitized).not.toBeNull()
  expect(sanitized?.children).toHaveLength(0)
})
