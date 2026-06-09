#!/bin/bash
# Run this once from your terminal to push everything to GitHub:
# chmod +x push.sh && ./push.sh

set -e
cd "$(dirname "$0")"

# Remove stale git lock if present
rm -f .git/index.lock

# If no remote set yet, add it
if ! git remote | grep -q origin; then
  git remote add origin https://github.com/nurdthug/valueloop-mvp.git
fi

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
- migrations/002: exchanges.match_id unique constraint + activity_flags columns"

# Push (force if needed to sync with GitHub's existing main)
git push -u origin main --force-with-lease 2>/dev/null || git push -u origin main --force

echo ""
echo "Done! Check https://github.com/nurdthug/valueloop-mvp"
