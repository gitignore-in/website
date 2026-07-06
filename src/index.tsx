import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import readmeMarkdown from './readme.md?raw'
import { rehypeTrustBoundarySanitize } from './rehype-sanitize'

// rehype-raw is still needed so the upstream README's trusted HTML fragments
// are parsed into the markdown tree, but the local sanitizer strips unsafe
// tags and attributes before they reach the DOM.
export default function Home() {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeTrustBoundarySanitize]}
    >
      {readmeMarkdown}
    </ReactMarkdown>
  )
}

// biome-ignore lint/style/noNonNullAssertion: root must be present in the document
const mountTo = document.getElementById('root')!

ReactDOM.createRoot(mountTo).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
)
