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

export const buildInfoFromEnv = (
  env: BuildEnv,
  nowIso: string = new Date().toISOString(),
): BuildInfo => ({
  commit: env.GITHUB_SHA ?? 'unknown',
  runId: env.GITHUB_RUN_ID ?? 'unknown',
  runNumber: env.GITHUB_RUN_NUMBER ?? 'unknown',
  ref: env.GITHUB_REF_NAME ?? 'unknown',
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
