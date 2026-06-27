#!/bin/sh
# Set required status checks for the main branch.
# Requires: gh CLI authenticated as a repository admin.
#
# Usage:
#   ./scripts/setup-branch-protection.sh [OPTIONS]
#
# Options:
#   --repo OWNER/REPO   Target repository (default: gitignore-in/website)
#   --branch BRANCH     Target branch (default: main)
#   --dry-run           Print the gh API call without executing it
#   --help              Show this help message
#
# Required checks: test (test.yml), happy (happy.yml)
# strict=false: "Require branches to be up to date before merging" is intentionally
#   disabled so that PRs whose branch tip has passed CI can merge without rebasing.

set -eu

REPO="gitignore-in/website"
BRANCH="main"
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)   REPO="$2";   shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1;  shift   ;;
    --help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      printf 'error: unknown option: %s\n' "$1" >&2
      exit 1
      ;;
  esac
done

PAYLOAD='{
  "strict": false,
  "checks": [
    {"context": "test"},
    {"context": "happy"}
  ]
}'

printf '%s\n' "Setting required status checks on ${REPO}@${BRANCH}..."

if [ "$DRY_RUN" -eq 1 ]; then
  printf 'DRY RUN: gh api "repos/%s/branches/%s/protection/required_status_checks" --method PATCH --input -\n' \
    "${REPO}" "${BRANCH}"
  printf 'Payload:\n%s\n' "${PAYLOAD}"
  exit 0
fi

printf '%s' "${PAYLOAD}" | gh api "repos/${REPO}/branches/${BRANCH}/protection/required_status_checks" \
  --method PATCH \
  --input -

printf '%s\n' "Done. Required checks: test, happy"
