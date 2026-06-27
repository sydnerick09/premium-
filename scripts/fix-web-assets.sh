#!/usr/bin/env bash
# Vercel drops any folder named `node_modules` on upload, but Expo's web export
# puts the icon fonts under dist/assets/node_modules/@expo/vector-icons/... — so
# they 404 and every icon renders as a tofu box. This renames that folder and
# rewrites the references in the JS so the fonts actually deploy & load.
set -e
DIST="$(dirname "$0")/../dist"
cd "$DIST"
if [ -d assets/node_modules ]; then
  mv assets/node_modules assets/deps
  # rewrite every reference (JS, html, json) from the node_modules path to deps
  grep -rl "assets/node_modules" . 2>/dev/null | while read -r f; do
    sed -i 's#assets/node_modules#assets/deps#g' "$f"
  done
  echo "fix-web-assets: moved assets/node_modules -> assets/deps and rewrote refs"
else
  echo "fix-web-assets: nothing to do (no assets/node_modules)"
fi
