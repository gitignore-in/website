import { expect, test } from 'bun:test'

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
