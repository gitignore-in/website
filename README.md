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
bun run dev           # http://localhost:3000
bun run lint          # Biome check + local README HTML element check
bun run check:readme  # verify src/readme.md matches upstream (needs network)
bun run format        # auto-format with Biome
bun run test          # run Cypress E2E tests
bun run build         # production build
```

`bun run lint` runs Biome and checks `src/readme.md` for disallowed HTML
elements; both checks are local and require no network access. `bun run
check:readme` verifies that `src/readme.md` matches the upstream
`gitignore-in/gitignore-in` README at the pinned commit in
`scripts/check-readme-sync.ts`. That check fetches the upstream file over the
network, so it is run separately from `lint`, as its own step in the
[`Publish Website`](.github/workflows/publish.yml) workflow (see
[DEPLOYING.md](./DEPLOYING.md)).

## Deployment

See [DEPLOYING.md](./DEPLOYING.md) for the deployment process and rollback instructions.

## Change history

See [CHANGELOG.md](./CHANGELOG.md) for notable changes.

## Related

- [gitignore-in/gitignore-in](https://github.com/gitignore-in/gitignore-in) — the gitignore data source that this site renders
