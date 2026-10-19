import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export type BuildInfo = {
  commit: string
  runId: string
  runNumber: string
  ref: string
  builtAt: string
}

export type BuildEnv = Readonly<Record<string, string | undefined>>

const outDir = fileURLToPath(new URL('../out', import.meta.url))
export const buildInfoPath = `${outDir}/build-info.json`

const fallbackUnknown = (value: string | undefined): string =>
  value ?? 'unknown'

export const buildInfoFromEnv = (
  env: BuildEnv,
  nowIso: string = new Date().toISOString(),
): BuildInfo => ({
  commit: fallbackUnknown(env.GITHUB_SHA),
  runId: fallbackUnknown(env.GITHUB_RUN_ID),
  runNumber: fallbackUnknown(env.GITHUB_RUN_NUMBER),
  ref: fallbackUnknown(env.GITHUB_REF_NAME),
  builtAt: nowIso,
})

export const writeBuildInfo = async (
  buildInfo: BuildInfo,
  destination: string = buildInfoPath,
): Promise<void> => {
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, `${JSON.stringify(buildInfo, null, 2)}\n`)
}

if (import.meta.main) {
  await writeBuildInfo(buildInfoFromEnv(process.env))
}
