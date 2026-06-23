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
