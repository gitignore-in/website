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

test('cancels a non-OK upstream response body before reporting the failure', async () => {
  let cancelCount = 0
  const response = new Response(
    new ReadableStream({
      cancel: () => {
        cancelCount += 1
      },
    }),
    { status: 503, statusText: 'Service Unavailable' },
  )

  await expect(
    checkReadmeSync(
      async () => response,
      async () => 'readme',
    ),
  ).rejects.toThrow(
    `Failed to fetch upstream README at ${upstreamReadmeCommit}: 503 Service Unavailable`,
  )
  expect(cancelCount).toBe(1)
})

test('finishes upstream body handling before a local README failure', async () => {
  let releaseBody = () => {}
  const response = new Response(
    new ReadableStream({
      start: async (controller) => {
        await new Promise<void>((resolve) => {
          releaseBody = resolve
        })
        controller.enqueue(new TextEncoder().encode('readme'))
        controller.close()
      },
    }),
  )
  let localReadStarted = false
  const missingReadme = new Error('missing')
  ;(missingReadme as NodeJS.ErrnoException).code = 'ENOENT'

  const result = checkReadmeSync(
    async () => response,
    async () => {
      localReadStarted = true
      throw missingReadme
    },
  )

  expect(localReadStarted).toBe(false)
  releaseBody()
  await expect(result).rejects.toThrow(
    'src/upstream/readme.md not found; run `git checkout src/upstream/readme.md` to restore',
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
    'src/upstream/readme.md not found; run `git checkout src/upstream/readme.md` to restore',
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
