#!/usr/bin/env bash
set -euo pipefail

VPS="root@137.184.40.238"

echo "==> Deploying BigNight..."

ssh "$VPS" bash -s << 'DEPLOY'
set -euo pipefail
export PATH="/usr/local/bin:$HOME/.bun/bin:$PATH"

cd /opt/bignight

echo "--- Fetching latest code..."
git fetch origin
git reset --hard origin/main

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
if systemctl is-active --quiet bignight; then
    echo "Service is running."
else
    echo "WARNING: Service failed to start!"
    journalctl -u bignight --no-pager -n 20
    exit 1
fi

echo "==> Deploy complete."
DEPLOY
