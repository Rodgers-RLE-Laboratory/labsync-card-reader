#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="/opt/labsync-card-reader"
REPO_URL="https://github.com/Rodgers-RLE-Laboratory/labsync-card-reader.git"
SERVICE_NAME="labsync-card-reader"
NODE_MAJOR=20

echo "========================================"
echo "  LabSync Card Reader — Install Script  "
echo "========================================"
echo

# ── Must run as root (or with sudo) ─────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "Error: This script must be run as root (use sudo)."
  exit 1
fi

# ── 1. Install Node.js 20 LTS if needed ─────────────────────────────
if command -v node &>/dev/null && [[ "$(node -v | cut -d. -f1 | tr -d v)" -ge "$NODE_MAJOR" ]]; then
  echo "[OK] Node.js $(node -v) is already installed."
else
  echo "[*] Installing Node.js ${NODE_MAJOR}.x via NodeSource..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  echo "[OK] Installed Node.js $(node -v)."
fi

# ── 2. Clone or update the repo ─────────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "[*] Updating existing install at $INSTALL_DIR..."
  git -C "$INSTALL_DIR" fetch --all
  git -C "$INSTALL_DIR" reset --hard origin/main
else
  echo "[*] Cloning repo to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

# ── 3. Build the app ────────────────────────────────────────────────
echo "[*] Installing dependencies and building..."
cd "$INSTALL_DIR"
npm ci --omit=dev
npm run build

# Copy static assets into standalone output (required by Next.js standalone)
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static

echo "[OK] Build complete."

# ── 4. Prompt for environment variables ──────────────────────────────
ENV_FILE="$INSTALL_DIR/.env.local"

if [[ -f "$ENV_FILE" ]]; then
  echo
  read -rp "[?] .env.local already exists. Overwrite? [y/N] " overwrite
  if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
    echo "[OK] Keeping existing .env.local."
  else
    rm "$ENV_FILE"
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo
  echo "── Environment Configuration ──"
  echo "Press Enter to skip optional values."
  echo

  read -rp "MIT_CARD_CLIENT_ID (required): " MIT_CARD_CLIENT_ID
  read -rp "MIT_CARD_CLIENT_SECRET (required): " MIT_CARD_CLIENT_SECRET
  read -rp "FIREBASE_SERVICE_ACCOUNT_KEY path (required) [/opt/labsync-card-reader/firebase-service-account.json]: " FIREBASE_KEY
  FIREBASE_KEY="${FIREBASE_KEY:-/opt/labsync-card-reader/firebase-service-account.json}"
  read -rp "NEMO_URL (optional): " NEMO_URL
  read -rp "NEMO_API_TOKEN (optional): " NEMO_API_TOKEN
  read -rp "NEMO_AREA_ID (optional): " NEMO_AREA_ID
  read -rp "SITE_TITLE (optional) [LabSync]: " SITE_TITLE
  SITE_TITLE="${SITE_TITLE:-LabSync}"

  cat > "$ENV_FILE" <<EOF
MIT_CARD_CLIENT_ID=${MIT_CARD_CLIENT_ID}
MIT_CARD_CLIENT_SECRET=${MIT_CARD_CLIENT_SECRET}
FIREBASE_SERVICE_ACCOUNT_KEY=${FIREBASE_KEY}
NEMO_URL=${NEMO_URL}
NEMO_API_TOKEN=${NEMO_API_TOKEN}
NEMO_AREA_ID=${NEMO_AREA_ID}
SITE_TITLE=${SITE_TITLE}
EOF

  chmod 600 "$ENV_FILE"
  echo "[OK] Wrote $ENV_FILE"
fi

# ── 5. Set ownership ────────────────────────────────────────────────
# Determine the target user (prefer 'pi', fall back to SUDO_USER)
RUN_USER="${SUDO_USER:-pi}"
if ! id "$RUN_USER" &>/dev/null; then
  RUN_USER="pi"
fi
chown -R "$RUN_USER:$RUN_USER" "$INSTALL_DIR"

# ── 6. Install systemd service ──────────────────────────────────────
echo "[*] Installing systemd service..."
sed "s/^User=.*/User=${RUN_USER}/" "$INSTALL_DIR/labsync-card-reader.service" \
  > /etc/systemd/system/labsync-card-reader.service

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
echo "[OK] Service installed and started."

# ── Done ─────────────────────────────────────────────────────────────
echo
echo "========================================"
echo "  Installation complete!"
echo "  The app is running at http://localhost:3000"
echo ""
echo "  Manage the service:"
echo "    sudo systemctl status $SERVICE_NAME"
echo "    sudo systemctl restart $SERVICE_NAME"
echo "    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "  To set up kiosk mode, run:"
echo "    sudo bash $INSTALL_DIR/kiosk.sh"
echo "========================================"
