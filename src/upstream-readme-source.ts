// Single source of truth for the upstream README this site renders.
// `scripts/check-readme-sync.ts` uses this to fetch and diff the pinned
// upstream file, and `src/readme-html-sanitizer.ts` uses it to resolve
// repo-relative links (e.g. `./LICENSE`) in that README to real GitHub URLs.
export const upstreamRepoOwner = 'gitignore-in'
export const upstreamRepoName = 'gitignore-in'
export const upstreamReadmeCommit = '158b4af5f91f3d1ef78be74c76507327448eedff'

export const upstreamReadmeSourceUrl = `https://raw.githubusercontent.com/${upstreamRepoOwner}/${upstreamRepoName}/${upstreamReadmeCommit}/README.md`
