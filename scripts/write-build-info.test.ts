import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'bun:test'

import { buildInfoFromEnv, writeBuildInfo } from './write-build-info'

let tempDir: string | undefined

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true })
    tempDir = undefined
  }
})

test('builds the build-info record from GitHub Actions env vars', () => {
  const buildInfo = buildInfoFromEnv(
    {
      GITHUB_SHA: 'abc123',
      GITHUB_RUN_ID: '42',
      GITHUB_RUN_NUMBER: '7',
      GITHUB_REF_NAME: 'main',
    },
    '2026-07-08T03:29:11.000Z',
  )

  expect(buildInfo).toEqual({
    commit: 'abc123',
    runId: '42',
    runNumber: '7',
    ref: 'main',
    builtAt: '2026-07-08T03:29:11.000Z',
  })
})

test('falls back to "unknown" for missing env vars', () => {
  const buildInfo = buildInfoFromEnv({}, '2026-07-08T03:29:11.000Z')

  expect(buildInfo).toEqual({
    commit: 'unknown',
    runId: 'unknown',
    runNumber: 'unknown',
    ref: 'unknown',
    builtAt: '2026-07-08T03:29:11.000Z',
  })
})

test('writes the build-info record as pretty-printed JSON', async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'write-build-info-'))
  const destination = join(tempDir, 'nested', 'build-info.json')

  await writeBuildInfo(
    {
      commit: 'abc123',
      runId: '42',
      runNumber: '7',
      ref: 'main',
      builtAt: '2026-07-08T03:29:11.000Z',
    },
    destination,
  )

  const written = await readFile(destination, 'utf8')
  expect(JSON.parse(written)).toEqual({
    commit: 'abc123',
    runId: '42',
    runNumber: '7',
    ref: 'main',
    builtAt: '2026-07-08T03:29:11.000Z',
  })
})
