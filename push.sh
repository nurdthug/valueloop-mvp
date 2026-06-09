#!/bin/bash
# Usage: ./push.sh YOUR_GITHUB_TOKEN
# Get a token at: https://github.com/settings/tokens/new
# Scopes needed: check "repo"

set -e
cd "$(dirname "$0")"

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo ""
  echo "Usage: ./push.sh YOUR_GITHUB_TOKEN"
  echo ""
  echo "Get one at: https://github.com/settings/tokens/new"
  echo "Check the 'repo' scope, set expiration to 90 days, click Generate token."
  echo ""
  exit 1
fi

# Remove stale git lock if present
rm -f .git/index.lock

# Set remote with token auth
git remote remove origin 2>/dev/null || true
git remote add origin https://nurdthug:${TOKEN}@github.com/nurdthug/valueloop-mvp.git

# Stage and commit everything
git add .
git commit -m "Phase 2-5: loop matching, AI logging, Stripe, admin pages, invite fix

- auth/callback: claim invite referral on email verify
- api/ai/match: 3-way loop detection + ai_recommendation_log writes
- api/ai/price: ai_recommendation_log writes + post_id param
- api/stripe/create-link: generate Stripe payment links for offers
- api/webhooks/stripe: handle checkout.session.completed
- post/new: cash price field + optional Stripe link generation
- admin/posts: all posts view with flag action
- admin/exchanges: outcomes, completion rate, cash tracking
- migrations/002: exchanges.match_id unique constraint + activity_flags columns" 2>/dev/null || echo "Nothing new to commit"

# Push
git push -u origin main --force

# Clean token out of remote URL
git remote set-url origin https://github.com/nurdthug/valueloop-mvp.git

echo ""
echo "Done! https://github.com/nurdthug/valueloop-mvp"
