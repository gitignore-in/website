import { readFile } from 'node:fs/promises'

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>
type LocalReadmeReader = () => Promise<string>

export const upstreamReadmeCommit = '158b4af5f91f3d1ef78be74c76507327448eedff'
export const sourceUrl = `https://raw.githubusercontent.com/gitignore-in/gitignore-in/${upstreamReadmeCommit}/README.md`

const localReadmeUrl = new URL('../src/upstream/readme.md', import.meta.url)

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

const cancelResponseBody = async (response: Response) => {
  try {
    await response.body?.cancel()
  } catch {
    // Preserve the HTTP status error when an already-errored stream rejects cancellation.
  }
}

const assertFetchResponseOk = async (response: Response) => {
  if (!response.ok) {
    await cancelResponseBody(response)
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
      'src/upstream/readme.md not found; run `git checkout src/upstream/readme.md` to restore',
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
    await assertFetchResponseOk(response)

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
  const upstreamReadme = await fetchUpstreamReadme(fetcher)
  const localReadme = await readLocalReadmeWithContext(readLocalReadme)

  if (normalize(localReadme) !== normalize(upstreamReadme)) {
    throw new Error(
      'src/upstream/readme.md is out of sync with gitignore-in/gitignore-in README.md',
    )
  }
}

if (import.meta.main) {
  await checkReadmeSync()
}
