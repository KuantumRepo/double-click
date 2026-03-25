#!/bin/bash
set -e

echo "==========================================="
echo "   Apple Portal — Unified Deployment"
echo "==========================================="

# --- 0. Pre-Flight Dependency Checks ---
echo "=> [Pre-Flight] Checking server dependencies..."

command -v npm >/dev/null 2>&1 || { echo >&2 "CRITICAL: 'npm' is not installed. Please install Node.js."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo >&2 "CRITICAL: 'pnpm' is not installed. Run: npm i -g pnpm"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo >&2 "CRITICAL: 'pm2' is not installed. Run: npm i -g pm2"; exit 1; }
command -v caddy >/dev/null 2>&1 || { echo >&2 "WARNING: 'caddy' is not installed. Auto-SSL will fail at the end."; }
command -v nano >/dev/null 2>&1 || { echo >&2 "WARNING: 'nano' is not installed. Use another editor for .env."; EDITOR=${EDITOR:-vi}; }
EDITOR=${EDITOR:-nano}

# --- 1. First-Time Interactive Setup ---
if [ ! -f "../backend/.env" ]; then
    echo -e "\n=> [Setup] No .env file detected."
    echo "=> [Setup] Copying template..."
    cp ../backend/.env.example ../backend/.env
    echo "=> [Setup] Opening .env in $EDITOR so you can enter your Rebilly credentials."
    read -p "Press [Enter] to continue..."
    $EDITOR ../backend/.env
fi


if grep -q "apple-checkout.yourdomain.com" Caddyfile; then
    echo -e "\n=> [Setup] SSL Domain Configuration required."
    read -p "Enter your live domain name (e.g., checkout.mybrand.com): " USER_DOMAIN
    if [ -n "$USER_DOMAIN" ]; then
        sed -i "s/apple-checkout.yourdomain.com/$USER_DOMAIN/g" Caddyfile
        echo "=> [Setup] Caddyfile updated to use $USER_DOMAIN!"
    fi
    echo ""
fi
# ---------------------------------------

# 1. Pull latest code
echo "=> Pulling latest code..."
git pull

# 2. Build the frontend
echo "=> Building Frontend SPA..."
cd ../frontend
pnpm install
pnpm build

# 3. Setup backend
echo "=> Installing Backend Dependencies..."
cd ../backend
npm install

# 4. Restart the monolithic server via PM2
echo "=> Restarting Production Server..."
cd ../deployment

if pm2 status | grep -q "apple-rebilly-checkout"; then
    pm2 restart ecosystem.config.js
else
    pm2 start ecosystem.config.js
fi

# 5. Reload Caddy for Auto-HTTPS
echo "=> Reloading Caddy Reverse Proxy (Auto-SSL)..."
caddy reload --config Caddyfile || echo "Note: Make sure Caddy is installed on your VPS to get automatic HTTPS."

echo "==========================================="
echo "   Deployment Complete!"
echo "==========================================="
