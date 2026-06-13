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
bun run build      # production build
```

`bun run lint` runs Biome and verifies that `src/readme.md` matches the
upstream `gitignore-in/gitignore-in` README at the pinned commit in
`scripts/check-readme-sync.ts`. The README sync check fetches that upstream
file over the network, so lint requires network access.

## Deployment

See [DEPLOYING.md](./DEPLOYING.md) for the deployment process and rollback instructions.

## Change history

See [CHANGELOG.md](./CHANGELOG.md) for notable changes.

## Related

- [gitignore-in/gitignore-in](https://github.com/gitignore-in/gitignore-in) — the gitignore data source that this site renders
