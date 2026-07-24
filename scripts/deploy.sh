#!/bin/bash

# Cloudflare Pages deployment. The ignored legacy ./functions directory contains
# dependencies from the prior host; deploy from a clean temporary cwd so Pages
# uploads only the Vite output.
set -euo pipefail

npm run build
deploy_root="$(mktemp -d /private/tmp/descowise-pages.XXXXXX)"
trap 'rm -rf "$deploy_root"' EXIT
cp -R dist "$deploy_root/dist"
npx wrangler --cwd "$deploy_root" pages deploy dist --project-name descowise --branch main --commit-dirty=true
