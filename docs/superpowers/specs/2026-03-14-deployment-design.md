# BigNight v2 Deployment Design

**Goal:** Deploy the BigNight v2 Bun monorepo to a single DigitalOcean VPS with automatic HTTPS, minimal operational overhead, and a one-command deploy workflow.

**Target:** `root@137.184.40.238` — DNS for `bignight.party` already points here.

---

## Architecture

```
Internet ─── HTTPS (:443) ──→ Caddy ──→ Bun/Hono (:3000)
                                            ├── /api/*        → Hono routes
                                            ├── /socket.io/*  → Socket.io WebSocket
                                            └── /*            → Static files (Vite build)
```

Single VPS, single Bun process, SQLite on local filesystem. Caddy handles TLS termination, certificate management (Let's Encrypt), HTTP→HTTPS redirect, and WebSocket proxying.

**App prerequisites (handled by the app plan, not this spec):**
- Server runs Drizzle migrations on startup (idempotent, safe for SQLite)
- Server serves Vite build output via Hono `serveStatic` middleware with SPA fallback

---

## VPS Filesystem Layout

```
/opt/bignight/                          # git clone of repo (HTTPS, public)
├── .env                                # production env vars (not in git)
├── packages/
│   ├── server/
│   │   ├── src/index.ts                # Bun entrypoint
│   │   └── bignight.db                 # SQLite database (created on first run)
│   └── web/
│       └── dist/                       # Vite build output (served by Hono)
└── ...

/etc/caddy/Caddyfile                    # Caddy reverse proxy config
/etc/systemd/system/bignight.service    # Bun process manager
```

---

## Caddy Configuration

```
bignight.party {
    reverse_proxy localhost:3000
}

www.bignight.party {
    redir https://bignight.party{uri} permanent
}
```

Caddy automatically:
- Obtains and renews Let's Encrypt certificates
- Redirects HTTP (:80) → HTTPS (:443)
- Proxies WebSocket upgrade headers (no extra config needed)
- Serves HTTP/2 and HTTP/3

---

## systemd Service

```ini
[Unit]
Description=BigNight Party
After=network.target

[Service]
Type=simple
User=bignight
Group=bignight
WorkingDirectory=/opt/bignight/packages/server
ExecStart=/usr/local/bin/bun src/index.ts
Restart=always
RestartSec=5
EnvironmentFile=/opt/bignight/.env

[Install]
WantedBy=multi-user.target
```

---

## Environment Variables

Production `.env` at `/opt/bignight/.env`:

```
NODE_ENV=production
PORT=3000
DB_PATH=bignight.db
JWT_SECRET=<random-64-char-string>
ADMIN_PIN=<chosen-admin-pin>
INVITE_CODE=<party-invite-code>
```

`JWT_SECRET` must be a strong random value in production. Generate with: `openssl rand -hex 32`

---

## deploy.sh

Lives in repo root. Run from local machine. Handles: pull latest code, install deps, build frontend, backup DB, restart service.

```bash
#!/usr/bin/env bash
set -euo pipefail

VPS="root@137.184.40.238"
APP_DIR="/opt/bignight"
DB_PATH="$APP_DIR/packages/server/bignight.db"

echo "==> Deploying BigNight..."

ssh "$VPS" bash -s << 'DEPLOY'
set -euo pipefail
export PATH="/usr/local/bin:$HOME/.bun/bin:$PATH"

cd /opt/bignight

echo "--- Pulling latest code..."
git pull

echo "--- Installing dependencies..."
bun install

echo "--- Building web frontend..."
bun run --filter web build

echo "--- Fixing ownership..."
chown -R bignight:bignight /opt/bignight

# Backup SQLite DB if it exists (using sqlite3 .backup for WAL-safe copy)
DB="/opt/bignight/packages/server/bignight.db"
if [ -f "$DB" ]; then
    BACKUP="$DB.bak-$(date +%Y%m%d-%H%M%S)"
    echo "--- Backing up database to $BACKUP..."
    sqlite3 "$DB" ".backup $BACKUP"
fi

echo "--- Restarting service..."
systemctl restart bignight

echo "--- Verifying..."
sleep 2
systemctl is-active --quiet bignight && echo "Service is running." || echo "WARNING: Service failed to start!"

echo "==> Deploy complete."
DEPLOY
```

Make executable: `chmod +x deploy.sh`

---

## provision.md (One-Time Server Setup Runbook)

This is a human/agent-guided runbook, not an automated script. Follow steps over SSH.

### Prerequisites

- VPS accessible at `root@137.184.40.238`
- DNS A record for `bignight.party` → `137.184.40.238` (already done)
- Ports 80 and 443 open in firewall

### Step 1: System Updates

```bash
apt update && apt upgrade -y
```

### Step 2: Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
ln -s ~/.bun/bin/bun /usr/local/bin/bun
bun --version  # verify — should work via /usr/local/bin/bun
```

The symlink ensures `bun` is available to systemd and non-interactive SSH sessions (like `deploy.sh`).

### Step 3: Create Service User

```bash
useradd --system --home-dir /opt/bignight --shell /usr/sbin/nologin bignight
```

(Ownership of `/opt/bignight` is set after cloning in Step 4.)

### Step 4: Install Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

### Step 5: Clone Repository

```bash
git clone https://github.com/<owner>/bignight.party.2.git /opt/bignight
chown -R bignight:bignight /opt/bignight
```

(Public repo, HTTPS clone, no keys needed.)

### Step 6: Create Production .env

```bash
cat > /opt/bignight/.env << 'EOF'
NODE_ENV=production
PORT=3000
DB_PATH=bignight.db
JWT_SECRET=<generate-with-openssl-rand-hex-32>
ADMIN_PIN=<choose-admin-pin>
INVITE_CODE=<choose-invite-code>
EOF
chown bignight:bignight /opt/bignight/.env
chmod 600 /opt/bignight/.env
```

### Step 7: Install Dependencies and Build

```bash
cd /opt/bignight
bun install
bun run --filter web build
```

### Step 8: Write Caddyfile

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
bignight.party {
    reverse_proxy localhost:3000
}

www.bignight.party {
    redir https://bignight.party{uri} permanent
}
EOF
```

### Step 9: Write systemd Unit

```bash
cat > /etc/systemd/system/bignight.service << 'EOF'
[Unit]
Description=BigNight Party
After=network.target

[Service]
Type=simple
User=bignight
Group=bignight
WorkingDirectory=/opt/bignight/packages/server
ExecStart=/usr/local/bin/bun src/index.ts
Restart=always
RestartSec=5
EnvironmentFile=/opt/bignight/.env

[Install]
WantedBy=multi-user.target
EOF
```

### Step 10: Install sqlite3 (for deploy backups)

```bash
apt install -y sqlite3
```

### Step 11: Enable and Start Services

```bash
systemctl daemon-reload
systemctl enable --now caddy
systemctl enable --now bignight
```

### Step 12: Verify

```bash
# Check services are running
systemctl status caddy
systemctl status bignight

# Check HTTPS (may take a few seconds for cert issuance)
curl -I https://bignight.party/api/health
```

Expected: `200 OK` with `{"ok":true}`.

---

## DB Backup Retention

The deploy script creates timestamped backups on each deploy. To prevent unbounded growth, periodically clean old backups:

```bash
# Keep only the 5 most recent backups
ls -t /opt/bignight/packages/server/bignight.db.bak-* | tail -n +6 | xargs rm -f
```

This can be added to the deploy script or run manually. Given deploys happen a few times a year around Oscar season, this is unlikely to matter in practice.

---

## Rollback

If a deploy breaks the app:

```bash
ssh root@137.184.40.238
cd /opt/bignight
git log --oneline -5              # find the last good commit
git reset --hard <good-commit>    # roll back on-branch (not detached HEAD)
bun install
bun run --filter web build
systemctl restart bignight
```

Note: `git reset --hard` is intentionally destructive here — we're reverting to a known-good state. Next `git pull` will fast-forward back to HEAD when the issue is fixed.

To restore the DB from backup:

```bash
cp packages/server/bignight.db.bak-<timestamp> packages/server/bignight.db
systemctl restart bignight
```
