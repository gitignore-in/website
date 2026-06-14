#!/bin/sh
# Set required status checks for the main branch.
# Requires: gh CLI authenticated as a repository admin.
#
# Usage:
#   ./scripts/setup-branch-protection.sh
#
# Required checks: test (test.yml), happy (happy.yml)

set -eu

REPO="gitignore-in/website"
BRANCH="main"

printf '%s\n' "Setting required status checks on ${REPO}@${BRANCH}..."

printf '%s' '{
  "strict": false,
  "checks": [
    {"context": "test"},
    {"context": "happy"}
  ]
}' | gh api "repos/${REPO}/branches/${BRANCH}/protection/required_status_checks" \
      --method PATCH \
      --input -

printf '%s\n' "Done. Required checks: test, happy"
