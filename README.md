# gitignore-in/website

Source code for [gitignore.in](https://gitignore.in) — a web interface for generating `.gitignore` files.

## Stack

- React 19 + Vite + TypeScript
- Runtime: bun
- Lint/format: Biome
- E2E tests: Cypress

## Local development

```sh
bun install
bun run dev        # http://localhost:3000
bun run lint       # Biome check + readme sync check
bun run format     # auto-format with Biome
bun run test       # run Cypress E2E tests
bun run build      # production build
```

## Deployment

See [DEPLOYING.md](./DEPLOYING.md) for the deployment process and rollback instructions.

## Change history

See [CHANGELOG.md](./CHANGELOG.md) for notable changes.

## Related

- [gitignore-in/gitignore-in](https://github.com/gitignore-in/gitignore-in) — the gitignore data source that this site renders
