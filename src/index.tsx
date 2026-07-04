import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import readmeMarkdown from './readme.md?raw'

// rehype-raw is intentionally enabled so that the upstream README's raw HTML
// elements (e.g. <img> tags for concept diagrams) render correctly.
// Trust model: src/readme.md is checked against gitignore-in/gitignore-in's
// main branch README in CI and the publish workflow. Any raw HTML that the
// upstream README introduces will be executed in the browser as-is.
export default function Home() {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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
