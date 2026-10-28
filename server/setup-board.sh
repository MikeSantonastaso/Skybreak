#!/usr/bin/env bash
# Sets up Skybreak's daily sortie leaderboard (server/board.js) on the droplet that already runs the
# matchmaking server (server/setup.sh). Run as root. Safe to run again.
#
#   https://board.<ip-with-dashes>.sslip.io  ->  Caddy (TLS)  ->  127.0.0.1:9100 board.js
#
#   curl -fsSL https://raw.githubusercontent.com/MikeSantonastaso/Skybreak/main/server/setup-board.sh | sudo bash
set -euo pipefail

IP="$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
HOST="board.${IP//./-}.sslip.io"
PORT=9100
SRC="${BOARD_SRC:-https://raw.githubusercontent.com/MikeSantonastaso/Skybreak/main/server/board.js}"

echo "==> Setting up the daily leaderboard at https://$HOST"

command -v node >/dev/null || { export DEBIAN_FRONTEND=noninteractive; apt-get update -qq; apt-get install -y -qq nodejs >/dev/null; }
command -v caddy >/dev/null || { echo "Caddy isn't installed. Run server/setup.sh first (the matchmaking server)."; exit 1; }

mkdir -p /opt/skybreak-board
curl -fsSL "$SRC" -o /opt/skybreak-board/board.js
id -u skyboard >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin skyboard

cat > /etc/systemd/system/skybreak-board.service <<UNIT
[Unit]
Description=Skybreak daily sortie leaderboard
After=network.target

[Service]
User=skyboard
Environment=PORT=$PORT HOST=127.0.0.1
StateDirectory=skybreak-board
ExecStart=$(command -v node) /opt/skybreak-board/board.js
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

mkdir -p /etc/caddy/sites
grep -q 'import /etc/caddy/sites/\*.caddy' /etc/caddy/Caddyfile 2>/dev/null || echo 'import /etc/caddy/sites/*.caddy' >> /etc/caddy/Caddyfile
cat > /etc/caddy/sites/skybreak-board.caddy <<SITE
$HOST {
	reverse_proxy 127.0.0.1:$PORT
}
SITE

systemctl daemon-reload
systemctl enable --now skybreak-board >/dev/null 2>&1
systemctl restart skybreak-board
systemctl reload caddy || systemctl restart caddy

echo "==> Waiting for the certificate (up to a minute)…"
for i in $(seq 1 30); do
  if curl -fsS "https://$HOST/health" 2>/dev/null | grep -q skybreak-board; then
    echo
    echo "All set. The daily leaderboard is live at https://$HOST"
    exit 0
  fi
  sleep 2
done

echo
echo "Services are installed, but https://$HOST did not answer yet."
echo "Copy the output of these two commands back to Claude:"
echo "  systemctl status skybreak-board --no-pager"
echo "  journalctl -u caddy -n 30 --no-pager"
exit 1
