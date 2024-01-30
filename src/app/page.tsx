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
        It is inspired by gitignore.io gibo commands. <br />
        .gitignore.in file stores the target of gibo and gitignore.io, so you
        can regenerate .gitignore file by gitignore.in command.
        <Image
          alt="generate .gitignore from .gitignore.in"
          width="735"
          height="336"
          src="/concept.png"
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
        <code>
          $ brew tap gitignore-in/gitignore-in <br />$ brew install gitignore-in
        </code>
      </p>
      <h2>Usage</h2>
      <p>
        Usage
        <code>$ gitignore.in</code>
        This will generate a .gitignore.in and .gitignore file in the current
        directory.
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
