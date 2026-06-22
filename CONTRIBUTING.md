# Contributing

## Development setup

```sh
bun install
bun run dev    # http://localhost:3000
```

## Before submitting a PR

```sh
bun run lint   # Biome check + readme sync check
bun run build  # verify the production build
```

## Scope

This repository contains the website source code for [gitignore.in](https://gitignore.in).
The `.gitignore` data itself lives in [gitignore-in/gitignore-in](https://github.com/gitignore-in/gitignore-in).

- Bug fixes and improvements to the site UI belong here.
- Changes to `.gitignore` content belong in `gitignore-in/gitignore-in`.
