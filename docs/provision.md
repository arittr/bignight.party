# BigNight VPS Provisioning Runbook

One-time server setup for `root@137.184.40.238`. Follow steps over SSH.

See `docs/superpowers/specs/2026-03-14-deployment-design.md` for full design rationale.

## Prerequisites

- VPS accessible at `root@137.184.40.238`
- DNS A record for `bignight.party` → `137.184.40.238` (already done)

## Step 1: System Updates

```bash
apt update && apt upgrade -y
```

## Step 2: Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
ln -s ~/.bun/bin/bun /usr/local/bin/bun
bun --version  # verify — should work via /usr/local/bin/bun
```

The symlink ensures `bun` is available to systemd and non-interactive SSH sessions (like `deploy.sh`).

## Step 3: Create Service User

```bash
useradd --system --home-dir /opt/bignight --shell /usr/sbin/nologin bignight
```

Ownership of `/opt/bignight` is set after cloning in Step 5.

## Step 4: Install Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

## Step 5: Clone Repository

```bash
git clone https://github.com/<owner>/bignight.party.2.git /opt/bignight
chown -R bignight:bignight /opt/bignight
```

Public repo, HTTPS clone, no keys needed.

## Step 6: Create Production .env

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

Generate `JWT_SECRET` with: `openssl rand -hex 32`

## Step 7: Install Dependencies and Build

```bash
cd /opt/bignight
bun install
bun run --filter web build
chown -R bignight:bignight /opt/bignight
```

## Step 8: Write Caddyfile

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

## Step 9: Write systemd Unit

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
MemoryMax=512M
EnvironmentFile=/opt/bignight/.env

[Install]
WantedBy=multi-user.target
EOF
```

## Step 10: Install sqlite3 (for deploy backups)

```bash
apt install -y sqlite3
```

## Step 11: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000
ufw --force enable
```

Port 3000 is blocked externally — all traffic must go through Caddy.

## Step 12: Enable and Start Services

```bash
systemctl daemon-reload
systemctl enable --now caddy
systemctl enable --now bignight
```

## Step 13: Verify

```bash
# Check services are running
systemctl status caddy
systemctl status bignight

# Check HTTPS (may take a few seconds for cert issuance)
curl -I https://bignight.party/api/health
```

Expected: `200 OK` with `{"ok":true}`.

## Logs and Debugging

```bash
# Follow app logs live
journalctl -u bignight -f

# Last 50 lines of app logs
journalctl -u bignight -n 50 --no-pager

# App logs since a specific time
journalctl -u bignight --since "5 minutes ago"

# Caddy logs (access + errors)
journalctl -u caddy -f

# Check if service is running
systemctl status bignight
```

## Rollback

If a deploy breaks the app:

```bash
cd /opt/bignight
git log --oneline -5              # find the last good commit
git reset --hard <good-commit>
bun install
bun run --filter web build
chown -R bignight:bignight /opt/bignight
systemctl restart bignight
```

To restore the DB from backup:

```bash
systemctl stop bignight
rm -f packages/server/bignight.db-wal packages/server/bignight.db-shm
cp packages/server/bignight.db.bak-<timestamp> packages/server/bignight.db
chown bignight:bignight packages/server/bignight.db
systemctl start bignight
```

The WAL and SHM files must be removed before restoring — a stale WAL could replay uncommitted changes on top of the restored backup.
