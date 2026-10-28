#!/usr/bin/env bash
# Sets up Skybreak's TURN relay (coturn) on the droplet that already runs the matchmaking server
# (server/setup.sh). Run as root. Safe to run again.
#
# Most home routers let two browsers link up directly, but some (phone hotspots, many mobile
# carriers, university and office networks) don't. Then the game's traffic goes through this relay.
#
#   turn:<ip>:3478 (UDP and TCP)  ->  coturn, relaying on UDP 49160-49359
#
#   curl -fsSL https://raw.githubusercontent.com/MikeSantonastaso/Skybreak/main/server/setup-turn.sh | sudo bash
set -euo pipefail

IP="$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
PORT=3478
MIN_PORT=49160
MAX_PORT=49359
# The browser has to know these, so they are in net.js too. They only let someone use the relay,
# which is capped below and can't reach anything on the droplet or its private network.
USER_NAME=skybreak
PASSWORD=22ae7468ac6f5f4841e50bb8

echo "==> Setting up the TURN relay at turn:$IP:$PORT"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq coturn ufw >/dev/null

cat > /etc/turnserver.conf <<CONF
# Skybreak co-op relay. Written by server/setup-turn.sh; run it again rather than editing this.
listening-port=$PORT
listening-ip=0.0.0.0
external-ip=$IP
min-port=$MIN_PORT
max-port=$MAX_PORT
realm=skybreak
fingerprint
lt-cred-mech
user=$USER_NAME:$PASSWORD

# Plain TURN only: the game's data channels are already encrypted end to end.
no-tls
no-dtls
no-cli
no-multicast-peers

# Keep it for Skybreak: a handful of sessions per pilot, modest bandwidth, and never relay into
# the droplet itself (the broker and the board listen on localhost) or any private network.
user-quota=16
total-quota=200
max-bps=500000
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=::1
denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff

log-file=syslog
simple-log
CONF

# Older coturn packages only start when this is set.
[ -f /etc/default/coturn ] && sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn

ufw allow $PORT/udp >/dev/null
ufw allow $PORT/tcp >/dev/null
ufw allow $MIN_PORT:$MAX_PORT/udp >/dev/null

systemctl enable coturn >/dev/null 2>&1
systemctl restart coturn
sleep 2

if systemctl is-active --quiet coturn && ss -lnu | grep -q ":$PORT "; then
  echo
  echo "All set. The relay is live at turn:$IP:$PORT (user $USER_NAME)."
  echo "If the droplet also has a DigitalOcean cloud firewall, allow UDP $PORT, TCP $PORT and UDP $MIN_PORT-$MAX_PORT there too."
  exit 0
fi

echo
echo "coturn is installed but isn't listening on $PORT yet."
echo "Copy the output of this command back to Claude:"
echo "  journalctl -u coturn -n 40 --no-pager"
exit 1
