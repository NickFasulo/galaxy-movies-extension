#!/usr/bin/env bash
# Builds dist zips for store submission + GitHub releases.
# Usage: scripts/package.sh [version]
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")}"
OUT="dist/galaxy-movies-extension-${VERSION}.zip"
mkdir -p dist
rm -f "$OUT"
zip -r "$OUT" manifest.json background.js content.js popup.html popup.css popup.js options.html options.css options.js icons LICENSE README.md -x "*.DS_Store"
echo "built $OUT"

# Lint for AMO if web-ext is available
if command -v web-ext >/dev/null 2>&1; then
  web-ext lint --source-dir . --ignore-files "scripts" "dist" "store-assets" || true
fi
