import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>gitignore.in</h1>
      <p>.gitignore generator for your project</p>
      <h2>Concept</h2>
      <p>
        gitignore.in is a tool to generate .gitignore files for your projects.
        <br />
        <code>.gitignore.in</code> file stores the target of{' '}
        <Link href="https://github.com/simonwhitaker/gibo">gibo</Link> and{' '}
        <Link href="https://www.toptal.com/developers/gitignore/">
          gitignore.io
        </Link>
        . You can generate a .gitignore file by running the gitignore.in
        command.
        <Image
          alt="generate .gitignore from .gitignore.in"
          width="735"
          height="336"
          src="/concept.png"
          style={{
            display: 'block',
          }}
        />
      </p>
      <h2>Installation</h2>
      <h3>Binary Releases</h3>
      <p>
        Binary Releases Download the binary from the releases page
        <Link href="https://github.com/gitignore-in/gitignore-in/releases">
          https://github.com/gitignore-in/gitignore-in/releases
        </Link>
        <br />
        And place it in a directory that is in the PATH.
      </p>
      <h3>Homebrew (macOS)</h3>
      <p>
        Homebrew (macOS) You can install gitignore-in using the Homebrew package
        manager.
        <pre>
          <code>
            $ brew tap gitignore-in/gitignore-in <br />$ brew install
            gitignore-in
          </code>
        </pre>
      </p>
      <h2>Usage</h2>
      <p>
        Usage
        <pre>
          <code>$ gitignore.in</code>
        </pre>
        This will generate a <code>.gitignore.in</code> and .gitignore file in
        the current directory in first time. And you can edit .gitignore.in file
        and run gitignore.in command again. Then .gitignore file will be
        updated.
      </p>
      <h2>Repository</h2>
      <p>
        Repository:
        <Link href="https://github.com/gitignore-in/gitignore-in">
          https://github.com/gitignore-in/gitignore-in
        </Link>
      </p>
    </main>
  )
}
