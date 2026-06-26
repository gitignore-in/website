import { readFile } from 'node:fs/promises'

const sourceUrl =
  'https://raw.githubusercontent.com/gitignore-in/gitignore-in/main/README.md'

let response: Response
try {
  response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(10_000),
  })
} catch (err) {
  throw err instanceof Error && err.name === 'TimeoutError'
    ? new Error(`Timed out fetching upstream README from ${sourceUrl} (10s)`, {
        cause: err,
      })
    : err
}

if (!response.ok) {
  throw new Error(
    `Failed to fetch upstream README: ${response.status} ${response.statusText}`,
  )
}

let upstreamReadme = ''
let localReadme = ''
try {
  ;[upstreamReadme, localReadme] = await Promise.all([
    response.text(),
    readFile(new URL('../src/readme.md', import.meta.url), 'utf8'),
  ])
} catch (err) {
  throw (err as NodeJS.ErrnoException).code === 'ENOENT'
    ? new Error(
        'src/readme.md not found; run `git checkout src/readme.md` to restore',
        { cause: err },
      )
    : err
}

const normalize = (text: string) => text.normalize('NFC').replace(/\r\n/g, '\n')

if (normalize(localReadme) !== normalize(upstreamReadme)) {
  throw new Error(
    'src/readme.md is out of sync with gitignore-in/gitignore-in README.md',
  )
}
