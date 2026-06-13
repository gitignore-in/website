import { readFile } from 'node:fs/promises'

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>
type LocalReadmeReader = () => Promise<string>

export const upstreamReadmeCommit = '42f443ce633cb454058569a584bd4c08c44d710f'
export const sourceUrl = `https://raw.githubusercontent.com/gitignore-in/gitignore-in/${upstreamReadmeCommit}/README.md`

const localReadmeUrl = new URL('../src/readme.md', import.meta.url)

export const fetchUpstreamReadme = async (
  fetcher: Fetcher = fetch,
): Promise<string> => {
  const response = await fetcher(sourceUrl, {
    signal: AbortSignal.timeout(10_000),
  }).catch((cause: unknown) => {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${cause}`,
      { cause },
    )
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${response.status} ${response.statusText}`,
    )
  }

  return response.text()
}

export const checkReadmeSync = async (
  fetcher: Fetcher = fetch,
  readLocalReadme: LocalReadmeReader = () => readFile(localReadmeUrl, 'utf8'),
): Promise<void> => {
  const [upstreamReadme, localReadme] = await Promise.all([
    fetchUpstreamReadme(fetcher),
    readLocalReadme(),
  ])

  if (localReadme !== upstreamReadme) {
    throw new Error(
      'src/readme.md is out of sync with gitignore-in/gitignore-in README.md',
    )
  }
}

if (import.meta.main) {
  await checkReadmeSync()
}
