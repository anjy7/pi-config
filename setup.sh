#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Setting up pi-config at $SCRIPT_DIR"
echo ""

# Install npm dependencies for extensions that have package.json
for ext_dir in "$SCRIPT_DIR"/extensions/*/; do
  if [ -f "${ext_dir}package.json" ]; then
    ext_name="$(basename "$ext_dir")"
    echo "Installing dependencies for extension: $ext_name..."
    (cd "$ext_dir" && npm install --no-audit --no-fund)
  fi
done

echo ""
echo "✅ Setup complete!"
echo "Make sure ~/.pi/agent/auth.json is configured, then restart pi."
