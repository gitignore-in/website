import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import readmeMarkdown from './readme.md?raw'

// rehype-raw parses raw HTML in the upstream README (e.g. <img> tags for
// concept diagrams). rehype-sanitize follows immediately to strip dangerous
// elements and attributes before the tree reaches the browser.
// Trust model: src/readme.md is synced from gitignore-in/gitignore-in main
// via scripts/check-readme-sync.ts; sanitization is the technical backstop.
export default function Home() {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
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
