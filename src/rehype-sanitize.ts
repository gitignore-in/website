type HastNode = {
  type?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

const SAFE_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'input',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
])

const SAFE_URL_PATTERN = /^(?:https?:|mailto:|tel:|#|\/(?!\/)|\.\.\/|\.\/)/i
const SAFE_CLASS_NAME_PATTERN = /^[A-Za-z0-9_-]+$/

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSafeUrl = (value: unknown) =>
  typeof value === 'string' && SAFE_URL_PATTERN.test(value.trim())

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: small allowlist helper
const sanitizeClassName = (value: unknown) => {
  const classNames = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\s+/)
      : []

  const safeClassNames = classNames.filter(
    (className): className is string =>
      typeof className === 'string' &&
      className.length > 0 &&
      SAFE_CLASS_NAME_PATTERN.test(className),
  )

  return safeClassNames.length > 0 ? safeClassNames : undefined
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: small allowlist helper
const sanitizeDimension = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return value
  }

  return undefined
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: small allowlist helper
const sanitizeBooleanish = (value: unknown) =>
  value === true || value === false || value === '' ? value : undefined

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tag-specific allowlist
const sanitizeProperties = (tagName: string, properties: unknown) => {
  if (!isPlainObject(properties)) {
    return undefined
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase().startsWith('on')) {
      continue
    }

    if (
      key === 'style' ||
      key === 'srcdoc' ||
      key === 'dangerouslySetInnerHTML'
    ) {
      continue
    }

    if (key === 'className' && (tagName === 'code' || tagName === 'pre')) {
      const className = sanitizeClassName(value)
      if (className !== undefined) {
        sanitized[key] = className
      }
      continue
    }

    if (tagName === 'a') {
      if (key === 'href') {
        if (isSafeUrl(value)) {
          sanitized[key] = value
        }
        continue
      }

      if (key === 'title') {
        if (typeof value === 'string') {
          sanitized[key] = value
        }
        continue
      }

      continue
    }

    if (tagName === 'img') {
      if (key === 'src') {
        if (isSafeUrl(value)) {
          sanitized[key] = value
        }
        continue
      }

      if (key === 'alt' || key === 'title') {
        if (typeof value === 'string') {
          sanitized[key] = value
        }
        continue
      }

      if (key === 'width' || key === 'height') {
        const dimension = sanitizeDimension(value)
        if (dimension !== undefined) {
          sanitized[key] = dimension
        }
        continue
      }

      if (key === 'loading' || key === 'decoding' || key === 'referrerPolicy') {
        if (typeof value === 'string') {
          sanitized[key] = value
        }
        continue
      }

      continue
    }

    if (tagName === 'input') {
      if (key === 'type') {
        if (value === 'checkbox') {
          sanitized[key] = value
        }
        continue
      }

      if (key === 'checked' || key === 'disabled') {
        const booleanish = sanitizeBooleanish(value)
        if (booleanish !== undefined) {
          sanitized[key] = booleanish
        }
        continue
      }

      continue
    }

    if (tagName === 'td' || tagName === 'th') {
      if (key === 'colSpan' || key === 'rowSpan') {
        const dimension = sanitizeDimension(value)
        if (dimension !== undefined) {
          sanitized[key] = dimension
        }
        continue
      }

      if (key === 'align') {
        if (value === 'left' || value === 'center' || value === 'right') {
          sanitized[key] = value
        }
      }
    }
  }

  return sanitized
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: tree walk with allowlist filtering
const sanitizeNode = (node: HastNode): HastNode | null => {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.type === 'text') {
    return node
  }

  if (node.type !== 'root' && node.type !== 'element') {
    return null
  }

  if (node.type === 'element') {
    const tagName = node.tagName?.toLowerCase()
    if (!tagName || !SAFE_TAGS.has(tagName)) {
      return null
    }

    const sanitizedProperties = sanitizeProperties(tagName, node.properties)
    node.properties = sanitizedProperties ?? {}

    if (tagName === 'img' && !isSafeUrl(node.properties.src)) {
      return null
    }

    if (tagName === 'a' && !isSafeUrl(node.properties.href)) {
      delete node.properties.href
    }
  }

  if (Array.isArray(node.children)) {
    node.children = node.children
      .map((child) => sanitizeNode(child))
      .filter((child): child is HastNode => child !== null)
  }

  return node
}

export const rehypeTrustBoundarySanitize = () => {
  return (tree: HastNode) => {
    sanitizeNode(tree)
  }
}

export { sanitizeNode, sanitizeProperties }
