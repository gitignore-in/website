import { readFile } from 'node:fs/promises'

const sourceUrl =
  'https://raw.githubusercontent.com/gitignore-in/gitignore-in/main/README.md'

const response = await fetch(sourceUrl)
if (!response.ok) {
  throw new Error(
    `Failed to fetch upstream README: ${response.status} ${response.statusText}`,
  )
}

const [upstreamReadme, localReadme] = await Promise.all([
  response.text(),
  readFile(new URL('../src/readme.md', import.meta.url), 'utf8'),
])

if (localReadme !== upstreamReadme) {
  throw new Error(
    'src/readme.md is out of sync with gitignore-in/gitignore-in README.md',
  )
}
