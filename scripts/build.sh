#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Reign — build (Linux)"
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js 18+ first." >&2; exit 1
fi
npm ci 2>/dev/null || npm install
echo "→ Building AppImage + deb (x64)…"
npx electron-builder --linux --x64
echo ""
echo "Done. Artifacts in ./dist/:"
ls -lh dist/ 2>/dev/null || true
echo ""
echo "Run the AppImage:  ./dist/Reign-*.AppImage"
echo "Install the deb:   sudo dpkg -i dist/*.deb"
