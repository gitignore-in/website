type HNode = {
  type?: string
  tagName?: string
  value?: unknown
  properties?: Record<string, unknown>
  children?: HNode[]
}

type RehypePlugin = () => (tree: HNode) => void

const SAFE_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'kbd',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const DROP_ENTIRELY_TAGS = new Set([
  'base',
  'embed',
  'iframe',
  'input',
  'link',
  'meta',
  'object',
  'script',
  'style',
  'svg',
  'template',
  'textarea',
  'video',
  'audio',
  'canvas',
  'form',
  'button',
  'select',
  'option',
])

const GLOBAL_ALLOWED_ATTRIBUTES = new Set([
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'title',
])

const ALLOWED_ATTRIBUTES_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href', 'name', 'rel', 'target']),
  img: new Set([
    'alt',
    'decoding',
    'height',
    'loading',
    'src',
    'title',
    'width',
  ]),
  table: new Set(['summary']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
}

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: protocol allowlist keeps the check explicit.
function isSafeUrl(value: string) {
  const trimmed = value.trim()

  if (/\s/.test(trimmed)) {
    return false
  }

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('#')
  ) {
    return true
  }

  try {
    const parsed = new URL(trimmed)
    return SAFE_URL_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tiny guard around URL filtering.
function sanitizeUrlProperty(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  return isSafeUrl(value) ? value.trim() : undefined
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: attribute allowlist and URL guards are intentionally explicit.
function sanitizeProperties(
  tagName: string,
  properties: Record<string, unknown> | undefined,
) {
  if (!properties) {
    return undefined
  }

  const allowedAttributes = ALLOWED_ATTRIBUTES_BY_TAG[tagName] ?? new Set()
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(properties)) {
    const normalizedKey = key.toLowerCase()

    if (normalizedKey.startsWith('on')) {
      continue
    }

    if (
      !GLOBAL_ALLOWED_ATTRIBUTES.has(normalizedKey) &&
      !allowedAttributes.has(normalizedKey)
    ) {
      continue
    }

    if (normalizedKey === 'href' || normalizedKey === 'src') {
      const sanitizedUrl = sanitizeUrlProperty(value)

      if (sanitizedUrl === undefined) {
        continue
      }

      sanitized[key] = sanitizedUrl
      continue
    }

    if (normalizedKey === 'target') {
      sanitized[key] = value
      if (value === '_blank') {
        sanitized.rel = 'noreferrer noopener'
      }
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tree rewriting needs a small recursive walk.
function sanitizeChildren(children: HNode[] | undefined): HNode[] {
  if (!children) {
    return []
  }

  const sanitizedChildren: HNode[] = []

  for (const child of children) {
    const sanitizedChild = sanitizeNode(child)
    if (Array.isArray(sanitizedChild)) {
      sanitizedChildren.push(...sanitizedChild)
      continue
    }

    if (sanitizedChild) {
      sanitizedChildren.push(sanitizedChild)
    }
  }

  return sanitizedChildren
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tag allowlist requires explicit branching by node kind.
function sanitizeNode(node: HNode): HNode | HNode[] | null {
  if (!isPlainObject(node)) {
    return node
  }

  if (node.type === 'root') {
    return {
      ...node,
      children: sanitizeChildren(node.children),
    }
  }

  if (node.type !== 'element' || typeof node.tagName !== 'string') {
    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: sanitizeChildren(node.children),
      }
    }

    return node
  }

  const tagName = node.tagName.toLowerCase()

  if (DROP_ENTIRELY_TAGS.has(tagName)) {
    return null
  }

  const sanitizedChildren = sanitizeChildren(node.children)

  if (!SAFE_TAGS.has(tagName)) {
    return sanitizedChildren
  }

  return {
    ...node,
    properties: sanitizeProperties(tagName, node.properties),
    children: sanitizedChildren,
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: wrapper keeps the mutation point simple for rehype.
export function sanitizeReadmeHtmlTree(tree: HNode) {
  const sanitized = sanitizeNode(tree)

  if (Array.isArray(sanitized) || sanitized === null) {
    throw new Error('sanitizeReadmeHtmlTree expected a root node')
  }

  Object.assign(tree, sanitized)
  return tree
}

export const rehypeSanitizeReadme: RehypePlugin = () => (tree) => {
  sanitizeReadmeHtmlTree(tree)
}
