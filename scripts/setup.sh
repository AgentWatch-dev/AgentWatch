#!/usr/bin/env bash
set -euo pipefail

# AgentWatch Development Setup Script
# This script sets up a local development environment.

echo "============================================"
echo "  AgentWatch — Local Development Setup"
echo "============================================"
echo ""

# --- 1. Check Node.js 20+ ---
echo "[1/6] Checking Node.js version..."
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "  Install Node.js 20+: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required (found v$(node -v | sed 's/v//'))."
  echo "  Upgrade: https://nodejs.org/"
  exit 1
fi
echo "  Node.js $(node -v) ✓"

# --- 2. Check wrangler ---
echo ""
echo "[2/6] Checking wrangler..."
if ! command -v npx &>/dev/null; then
  echo "ERROR: npx is not available. Reinstall Node.js."
  exit 1
fi
# Check if wrangler is installed locally
if npx wrangler --version &>/dev/null 2>&1; then
  echo "  wrangler ✓"
else
  echo "  Installing wrangler locally..."
  npm install
  echo "  wrangler ✓ (installed)"
fi

# --- 3. Install dependencies ---
echo ""
echo "[3/6] Installing dependencies..."
npm install
echo "  npm install ✓"

# --- 4. Create KV namespace if needed ---
echo ""
echo "[4/6] Checking Cloudflare KV namespace..."
KV_ID=$(sed -n 's/.*id = "\([^"]*\)".*/\1/p' wrangler.toml 2>/dev/null | head -1)
if [ -z "$KV_ID" ] || [ "$KV_ID" = "<YOUR_KV_NAMESPACE_ID>" ]; then
  echo "  No KV namespace configured. Creating one..."
  if command -v npx &>/dev/null; then
    KV_OUTPUT=$(npx wrangler kv namespace create "KV" 2>&1 || true)
    NEW_KV_ID=$(echo "$KV_OUTPUT" | sed -n 's/.*id = "\([^"]*\)".*/\1/p' | head -1)
    if [ -n "$NEW_KV_ID" ]; then
      sed -i.bak "s/id = \"<YOUR_KV_NAMESPACE_ID>\"/id = \"$NEW_KV_ID\"/" wrangler.toml
      rm -f wrangler.toml.bak
      echo "  KV namespace created: $NEW_KV_ID ✓"
    else
      echo "  WARNING: Could not create KV namespace. You may need to run:"
      echo "    npx wrangler kv namespace create \"KV\""
      echo "  Then update the id in wrangler.toml"
    fi
  else
    echo "  WARNING: wrangler not available. Skipping KV creation."
  fi
else
  echo "  KV namespace configured: $KV_ID ✓"
fi

# --- 5. Copy .dev.vars.example to .dev.vars ---
echo ""
echo "[5/6] Setting up local environment variables..."
if [ -f .dev.vars ]; then
  echo "  .dev.vars already exists ✓ (skipped)"
else
  cp .dev.vars.example .dev.vars
  echo "  Created .dev.vars from template ✓"
  echo "  TODO: Edit .dev.vars and fill in your API keys"
fi

# --- 6. Print instructions ---
echo ""
echo "[6/6] Setup complete!"
echo ""
echo "============================================"
echo "  Next Steps"
echo "============================================"
echo ""
echo "  1. Edit .dev.vars and add your API keys:"
echo "     - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
echo "     - OPENAI_API_KEY (or other provider keys)"
echo "     - ADMIN_SECRET (for dashboard access)"
echo ""
echo "  2. Start the development server:"
echo "     npm run dev"
echo ""
echo "  3. Run the tests:"
echo "     npm test"
echo ""
echo "  4. Open the dashboard:"
echo "     http://localhost:8787"
echo ""
echo "  For more info, see README.md and docs/"
echo "============================================"
