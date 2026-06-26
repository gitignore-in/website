import { readFile } from 'node:fs/promises'

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>
type LocalReadmeReader = () => Promise<string>

export const upstreamReadmeCommit = '42f443ce633cb454058569a584bd4c08c44d710f'
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

const assertResponseBodyIsNotEmpty = (upstreamReadme: string) => {
  if (upstreamReadme.length === 0) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: response body was empty`,
    )
  }
}

const normalize = (text: string) => text.normalize('NFC').replace(/\r\n/g, '\n')

export const fetchUpstreamReadme = async (
  fetcher: Fetcher = fetch,
): Promise<string> => {
  let response: Response
  try {
    response = await fetcher(sourceUrl, {
      signal: AbortSignal.timeout(10_000),
    })
  } catch (cause) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${cause}`,
      { cause },
    )
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch upstream README at ${upstreamReadmeCommit}: ${response.status} ${response.statusText}`,
    )
  }

  const upstreamReadme = await readResponseText(response)
  assertResponseBodyIsNotEmpty(upstreamReadme)
  return upstreamReadme
}

export const checkReadmeSync = async (
  fetcher: Fetcher = fetch,
  readLocalReadme: LocalReadmeReader = () => readFile(localReadmeUrl, 'utf8'),
): Promise<void> => {
  let upstreamReadme = ''
  let localReadme = ''
  try {
    ;[upstreamReadme, localReadme] = await Promise.all([
      fetchUpstreamReadme(fetcher),
      readLocalReadme(),
    ])
  } catch (err) {
    throw (err as NodeJS.ErrnoException).code === 'ENOENT'
      ? new Error(
          'src/readme.md not found; run `git checkout src/readme.md` to restore',
          { cause: err },
        )
      : err
  }

  if (normalize(localReadme) !== normalize(upstreamReadme)) {
    throw new Error(
      'src/readme.md is out of sync with gitignore-in/gitignore-in README.md',
    )
  }
}

if (import.meta.main) {
  await checkReadmeSync()
}
