# Deployment Operations Guide

Welcome! This directory contains all the automation scripts, process managers, and reverse proxy settings required to run the Apple Payment Portal securely on a live Linux Virtual Private Server (VPS). 

To keep the application codebase clean, **all infrastructure code lives here.** 

---

## 1. The Architecture
This project runs as a monolithic system in production to eliminate Cross-Origin Resource Sharing (CORS) errors. 
- The **Frontend SPA** (`/frontend`) is compiled into static files.
- The **Backend Express API** (`/backend`) serves those static files directly, while alongside providing the `/api/deposit-request` routes on the exact same domain.

Here’s a cleaned-up version that will render correctly in Markdown and work as copy‑paste commands in a terminal.  

I also fixed the Markdown link syntax in the shell commands so they are valid.

***

## 2. Global Server Requirements

Before deploying, ensure the VPS has the latest version of Node.js installed, along with these global packages.

For automatic SSL certificates (required by Apple Pay), you must also install [Caddy Server](https://caddyserver.com/). [caddyserver](https://caddyserver.com/docs/running)

### Amazon Linux

```bash
sudo dnf install -y git curl tar && \
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
source "$NVM_DIR/nvm.sh" && \
nvm install 22 && \
nvm use 22 && \
nvm alias default 22 && \
node -v && \
npm install -g pnpm pm2 && \
sudo rm -f /usr/local/bin/caddy /tmp/caddy.tar.gz && \
CADDY_VERSION=$(curl -s https://api.github.com/repos/caddyserver/caddy/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/') && \
echo "Installing Caddy v${CADDY_VERSION}..." && \
curl -L "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_amd64.tar.gz" -o /tmp/caddy.tar.gz && \
tar -xzf /tmp/caddy.tar.gz -C /tmp && \
sudo mv /tmp/caddy /usr/local/bin/caddy && \
sudo chmod +x /usr/local/bin/caddy && \
caddy version && \
sudo groupadd --system caddy && \
sudo useradd --system --gid caddy --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin --comment "Caddy web server" caddy && \
sudo mkdir -p /etc/caddy && \
sudo chown -R caddy:caddy /etc/caddy && \
sudo curl -L https://raw.githubusercontent.com/caddyserver/dist/master/init/caddy.service -o /etc/systemd/system/caddy.service && \
sudo systemctl daemon-reload && \
sudo systemctl enable caddy
```

### Ubuntu

```bash
sudo apt update && \
sudo apt install -y git curl tar && \
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && \
source "$NVM_DIR/nvm.sh" && \
nvm install 22 && \
nvm use 22 && \
nvm alias default 22 && \
node -v && \
npm install -g pnpm pm2 && \
sudo rm -f /usr/local/bin/caddy /tmp/caddy.tar.gz && \
CADDY_VERSION=$(curl -s https://api.github.com/repos/caddyserver/caddy/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/') && \
echo "Installing Caddy v${CADDY_VERSION}..." && \
curl -L "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_amd64.tar.gz" -o /tmp/caddy.tar.gz && \
tar -xzf /tmp/caddy.tar.gz -C /tmp && \
sudo mv /tmp/caddy /usr/local/bin/caddy && \
sudo chmod +x /usr/local/bin/caddy && \
caddy version && \
sudo groupadd --system caddy && \
sudo useradd --system --gid caddy --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin --comment "Caddy web server" caddy && \
sudo mkdir -p /etc/caddy && \
sudo chown -R caddy:caddy /etc/caddy && \
sudo curl -L https://raw.githubusercontent.com/caddyserver/dist/master/init/caddy.service -o /etc/systemd/system/caddy.service && \
sudo systemctl daemon-reload && \
sudo systemctl enable caddy
```

You can drop this whole section back into your Deployment Operations Guide as-is.


For automatic SSL certificates (required by Apple Pay), you must also install [Caddy Server](https://caddyserver.com/).

## 3. Configuration Files

### `ecosystem.config.js`
This file is used by PM2 (Process Manager 2) to keep the Node.js backend running perpetually in the background. It will automatically restart the server if it crashes or the machine reboots.

### `Caddyfile`
Caddy is our automatic reverse proxy. It listens on ports 80 and 443 (HTTP/HTTPS), automatically negotiates a free cryptographic SSL Certificate via Let's Encrypt, and forwards the secure traffic internally to PM2 on port 3001.
- **Action Required:** Open `Caddyfile` and replace the placeholder `apple-checkout.yourdomain.com` with your actual live domain name.

### `deploy.sh`
This is your 1-click CI/CD pipeline. 

**First Run:**
If this is your first time deploying to a brand new server, `deploy.sh` acts as an interactive wizard. 
- It will verify all your dependencies are installed.
- It will copy `.env.example` to `.env` and immediately open `nano` so you can securely paste the Rebilly API keys.
- It will prompt you for your domain name and safely inject it into the Caddyfile.

**Subsequent Runs:**
Anytime you push new code to GitHub, simply SSH into your server and run:
```bash
cd deployment
./deploy.sh
```
The script will cleanly pull the new git code, build the frontend `dist` package, install any new backend dependencies, bounce the PM2 server, and reload Caddy. Zero downtime deployment.
