#!/usr/bin/env bash
# Sets up Skybreak's co-op matchmaking server (peerjs-server behind Caddy) on a
# fresh Ubuntu 24.04 droplet. Run as root. Safe to run again.
#
#   https://peer.<ip-with-dashes>.sslip.io  ->  Caddy (TLS)  ->  127.0.0.1:9000 peerjs
#
# Caddy reads every file in /etc/caddy/sites/, so other projects on this
# droplet can each add their own site file there later.
set -euo pipefail

IP="$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
HOST="peer.${IP//./-}.sslip.io"
PORT=9000
PEER_VERSION=1.0.2

echo "==> Setting up matchmaking at https://$HOST"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ufw nodejs npm debian-keyring debian-archive-keyring apt-transport-https gnupg >/dev/null

# Caddy, from its official apt repository.
if ! command -v caddy >/dev/null; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy >/dev/null
fi

# PeerJS broker, as its own locked-down user and service.
npm install -g --silent "peer@$PEER_VERSION"
id -u peerjs >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin peerjs

cat > /etc/systemd/system/skybreak-peer.service <<UNIT
[Unit]
Description=Skybreak co-op matchmaking (peerjs-server)
After=network.target

[Service]
User=peerjs
ExecStart=$(command -v peerjs) --host 127.0.0.1 --port $PORT --key peerjs --path / --proxied true
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

# Reverse proxy with an automatic Let's Encrypt certificate.
mkdir -p /etc/caddy/sites
cat > /etc/caddy/Caddyfile <<'CADDY'
import /etc/caddy/sites/*.caddy
CADDY
cat > /etc/caddy/sites/skybreak-peer.caddy <<SITE
$HOST {
	reverse_proxy 127.0.0.1:$PORT
}
SITE

# Firewall: SSH, HTTP (for the certificate) and HTTPS only.
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

systemctl daemon-reload
systemctl enable --now skybreak-peer >/dev/null 2>&1
systemctl restart skybreak-peer
systemctl enable caddy >/dev/null 2>&1
systemctl restart caddy

echo "==> Waiting for the certificate (up to a minute)…"
for i in $(seq 1 30); do
  if curl -fsS "https://$HOST/" 2>/dev/null | grep -q PeerJS; then
    echo
    echo "All set. Matchmaking is live at https://$HOST"
    exit 0
  fi
  sleep 2
done

echo
echo "Services are installed, but https://$HOST did not answer yet."
echo "Copy the output of these two commands back to Claude:"
echo "  systemctl status skybreak-peer --no-pager"
echo "  journalctl -u caddy -n 30 --no-pager"
exit 1
