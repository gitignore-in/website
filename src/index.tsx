import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import readmeMarkdown from './readme.md?raw'
import {
  rehypeSanitizeReadme,
  sanitizeReadmeHtmlTree,
} from './readme-html-sanitizer'

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

// biome-ignore lint/style/noNonNullAssertion: root must be present in the document
const mountTo = document.getElementById('root')!

if (window.navigator.userAgent.includes('Cypress')) {
  Object.assign(window, {
    __readmeSanitizerTestHooks: {
      sanitizeReadmeHtmlTree,
    },
  })
}

ReactDOM.createRoot(mountTo).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
)
