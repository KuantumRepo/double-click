#!/bin/bash
set -e

echo "==========================================="
echo "   Apple Portal — Unified Deployment"
echo "==========================================="

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

echo "==========================================="
echo "   Deployment Complete!"
echo "==========================================="
