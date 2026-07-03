# Deploying

## How it works

This site uses continuous deployment via GitHub Actions:

1. A pull request is opened against `main`
2. CI (lint, build) runs on the PR
3. After merging to `main`, the [`Publish Website`](https://github.com/gitignore-in/website/actions/workflows/publish.yml) workflow:
   - Runs `bun install`, `bun run check:readme`, and `bun run build`
   - Stops before publishing if the vendored README is stale
   - Pushes the built output to the `gh-pages` branch via `peaceiris/actions-gh-pages`
4. GitHub Pages serves the `gh-pages` branch at [gitignore.in](https://gitignore.in)

## Tracking what is deployed

- **Latest deploy**: the most recent green run of the `Publish Website` workflow
- **Deploy history**: [`gh-pages` branch commit log](https://github.com/gitignore-in/website/commits/gh-pages) — each deploy adds one commit
- **Change history**: [`CHANGELOG.md`](./CHANGELOG.md) — notable changes are recorded there

## Rollback

To rollback to a previous deployment:

1. Identify the target `gh-pages` commit SHA from the branch history
2. On a local clone, revert the `gh-pages` branch:
   ```sh
   git checkout gh-pages
   git reset --hard <target-sha>
   git push --force origin gh-pages
   ```
3. GitHub Pages will serve the reverted content within seconds

Alternatively, revert the problematic commit on `main` and merge via a PR,
which triggers a fresh deploy.
