import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { ErrorBoundary } from './error-boundary'
import { reportClientError } from './error-reporting'
import {
  rehypeSanitizeReadme,
  sanitizeReadmeHtmlTree,
} from './readme-html-sanitizer'
import readmeMarkdown from './upstream/readme.md?raw'

// rehype-raw preserves the upstream README's raw HTML, and the local
// sanitizer removes executable or unsafe tags and attributes before render.
export default function Home() {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitizeReadme]}
    >
      {readmeMarkdown}
    </ReactMarkdown>
  )
}

// Lets the Cypress suite exercise the ErrorBoundary without a
// production-only code path: the throw only fires if a test explicitly
// flips this flag through the Cypress-only test hook below.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the throw guard is the Cypress-only test hook itself.
function RenderErrorTrigger() {
  const [shouldThrow, setShouldThrow] = React.useState(false)

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: early return keeps the Cypress-only hook isolated.
  React.useEffect(() => {
    if (!window.navigator.userAgent.includes('Cypress')) {
      return
    }

    Object.assign(window, {
      __errorBoundaryTestHooks: {
        triggerRenderError: () => setShouldThrow(true),
      },
    })
  }, [])

  if (shouldThrow) {
    throw new Error('cypress-triggered render error')
  }

  return null
}

const mountTo = document.getElementById('root')

if (!mountTo) {
  throw new Error(
    "Failed to mount the app: no element with id 'root' was found in the document.",
  )
}

if (window.navigator.userAgent.includes('Cypress')) {
  Object.assign(window, {
    __readmeSanitizerTestHooks: {
      sanitizeReadmeHtmlTree,
    },
  })
}

window.addEventListener('error', (event) => {
  reportClientError('window-error', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  reportClientError('unhandled-rejection', event.reason)
})

ReactDOM.createRoot(mountTo).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RenderErrorTrigger />
      <Home />
    </ErrorBoundary>
  </React.StrictMode>,
)
