# gitignore.in website

Static website for [gitignore.in](https://gitignore.in).

## Development

Install dependencies with:

```sh
bun install --frozen-lockfile
```

Run the local checks with:

```sh
bun run lint
bun run build
bun run test:unit
```

`bun run lint` runs Biome and verifies that `src/readme.md` matches the
upstream `gitignore-in/gitignore-in` README at the pinned commit in
`scripts/check-readme-sync.ts`. The README sync check fetches that upstream
file over the network, so lint requires network access.

For the full Cypress check, start the preview server before running the test:

```sh
bun x vite preview --host 127.0.0.1 --port 3000
bun run test
```
