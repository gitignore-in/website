import { readFile } from 'node:fs/promises'

// Only these HTML element types are expected in the upstream README.
// rehype-raw passes them through to the browser DOM as-is.
// If the upstream README introduces a new element type, update this list
// after confirming it is safe to render without sanitization.
const ALLOWED_ELEMENTS = new Set(['img'])

const readmePath = new URL('../src/readme.md', import.meta.url)
const content = await readFile(readmePath, 'utf8')

// Remove fenced code blocks (``` ... ```) to avoid matching tags inside code.
const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '')

// Remove inline code spans (` ... `) to avoid matching tags inside code.
const withoutCode = withoutFencedBlocks.replace(/`[^`\n]+`/g, '')

// Remove HTML comments.
const withoutComments = withoutCode.replace(/<!--[\s\S]*?-->/g, '')

// Match opening tags: <tagname ...> or <tagname>
const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g
const unexpected: string[] = []
const allMatches = [...withoutComments.matchAll(tagPattern)]

for (const match of allMatches) {
  const tag = match[1].toLowerCase()
  if (!ALLOWED_ELEMENTS.has(tag)) {
    unexpected.push(`<${tag}>`)
  }
}

if (unexpected.length > 0) {
  const unique = [...new Set(unexpected)]
  console.error(
    `check:readme-html: unexpected HTML element(s) in src/readme.md: ${unique.join(', ')}`,
  )
  console.error(
    'Only the following elements are allowed: ' +
      [...ALLOWED_ELEMENTS].map((e) => `<${e}>`).join(', '),
  )
  console.error(
    'Update scripts/check-readme-html-elements.ts if the new element is safe to render via rehype-raw.',
  )
  process.exit(1)
}

console.log(
  `check:readme-html: ok (allowed elements only: ${[...ALLOWED_ELEMENTS].map((e) => `<${e}>`).join(', ')})`,
)
