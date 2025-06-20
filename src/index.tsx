import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const README_MARKDOWN = `
# [gitignore.in](https://github.com/gitignore-in/gitignore-in)

.gitignore generator for your project

## Concept

gitignore.in is a tool to generate .gitignore files for your projects.
\`.gitignore.in\` file stores the target of [gibo](https://github.com/simonwhitaker/gibo) and [gitignore.io](https://www.toptal.com/developers/gitignore/). You can generate a .gitignore file by running the gitignore.in command.

![generate .gitignore from .gitignore.in](./concept.png)

## Installation

### Binary Releases

Download the binary from the releases page https://github.com/gitignore-in/gitignore-in/releases

And place it in a directory that is in the \`PATH\`.

### Homebrew (macOS)

You can install gitignore-in using the Homebrew package manager.

\`\`\`
$ brew tap gitignore-in/gitignore-in
$ brew install gitignore-in
\`\`\`

## Usage

\`\`\`
$ gitignore.in
\`\`\`

This will generate a \`.gitignore.in\` and \`.gitignore\` file in the current directory in first time.
And you can edit \`.gitignore.in\` file and run \`gitignore.in\` command again. Then \`.gitignore\` file will be updated.

## Repository

Repository: https://github.com/gitignore-in/gitignore-in
`

export default function Home() {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{README_MARKDOWN}</ReactMarkdown>
  )
}

// biome-ignore lint/style/noNonNullAssertion: root must be present in the document
const mountTo = document.getElementById('root')!

ReactDOM.createRoot(mountTo).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
)
