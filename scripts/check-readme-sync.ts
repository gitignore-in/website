import { readFile } from 'node:fs/promises'

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>
type LocalReadmeReader = () => Promise<string>

export const upstreamReadmeCommit = '158b4af5f91f3d1ef78be74c76507327448eedff'
export const sourceUrl = `https://raw.githubusercontent.com/gitignore-in/gitignore-in/${upstreamReadmeCommit}/README.md`

const localReadmeUrl = new URL('../src/readme.md', import.meta.url)

const readResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.text()
  } catch (cause) {
    throw new Error(
      `Failed to read upstream README at ${upstreamReadmeCommit}: ${cause}`,
      { cause },
    )
  }
}

const assertFetchResponseOk = (response: Response) => {
  if (!response.ok) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${response.status} ${response.statusText}`,
    )
  }
}

const assertResponseBodyIsNotEmpty = (upstreamReadme: string) => {
  if (upstreamReadme.length === 0) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: response body was empty`,
    )
  }
}

const normalize = (text: string) => text.normalize('NFC').replace(/\r\n/g, '\n')

const mapReadLocalReadmeError = (err: unknown) => {
  if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
    throw new Error(
      'src/readme.md not found; run `git checkout src/readme.md` to restore',
      { cause: err },
    )
  }

  throw err
}

export const fetchUpstreamReadme = async (
  fetcher: Fetcher = fetch,
): Promise<string> => {
  try {
    const response = await fetcher(sourceUrl, {
      signal: AbortSignal.timeout(10_000),
    })
    assertFetchResponseOk(response)

    const upstreamReadme = await readResponseText(response)
    assertResponseBodyIsNotEmpty(upstreamReadme)
    return upstreamReadme
  } catch (cause) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${cause}`,
      { cause },
    )
  }
}

const readLocalReadmeWithContext = async (
  readLocalReadme: LocalReadmeReader,
) => {
  try {
    return await readLocalReadme()
  } catch (err) {
    return mapReadLocalReadmeError(err)
  }
}

export const checkReadmeSync = async (
  fetcher: Fetcher = fetch,
  readLocalReadme: LocalReadmeReader = () => readFile(localReadmeUrl, 'utf8'),
): Promise<void> => {
  const [upstreamReadme, localReadme] = await Promise.all([
    fetchUpstreamReadme(fetcher),
    readLocalReadmeWithContext(readLocalReadme),
  ])

  if (normalize(localReadme) !== normalize(upstreamReadme)) {
    throw new Error(
      'src/readme.md is out of sync with gitignore-in/gitignore-in README.md',
    )
  }
}

if (import.meta.main) {
  await checkReadmeSync()
}
