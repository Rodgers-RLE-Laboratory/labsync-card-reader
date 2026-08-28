#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  LabSync Card Reader — Kiosk Setup     "
echo "========================================"
echo

if [[ $EUID -ne 0 ]]; then
  echo "Error: This script must be run as root (use sudo)."
  exit 1
fi

KIOSK_USER="${SUDO_USER-pi}"
if [[ -z "$KIOSK_USER" ]] || ! id "$KIOSK_USER" &>/dev/null; then
  KIOSK_USER="pi"
fi

KIOSK_URL="http://localhost:3000"

echo "[*] Configuring kiosk mode for user: $KIOSK_USER"

# ── 1. Install dependencies ─────────────────────────────────────────
echo "[*] Installing kiosk dependencies..."
apt-get update -qq
apt-get install -y -qq unclutter xdotool

# Detect Chromium binary name (newer Pi OS uses 'chromium', older uses 'chromium-browser')
if command -v chromium &>/dev/null; then
  CHROMIUM_BIN="chromium"
elif command -v chromium-browser &>/dev/null; then
  CHROMIUM_BIN="chromium-browser"
else
  echo "[*] Chromium not found, installing..."
  apt-get install -y -qq chromium-browser 2>/dev/null || apt-get install -y -qq chromium
  if command -v chromium &>/dev/null; then
    CHROMIUM_BIN="chromium"
  else
    CHROMIUM_BIN="chromium-browser"
  fi
fi
echo "[OK] Using Chromium binary: $CHROMIUM_BIN"

# ── 2. Set up autologin ─────────────────────────────────────────────
echo "[*] Configuring autologin..."

# Try raspi-config nonint first (works on Raspberry Pi OS)
if command -v raspi-config &>/dev/null; then
  # B4 = Desktop Autologin
  raspi-config nonint do_boot_behaviour B4
  echo "[OK] Autologin configured via raspi-config."
elif [[ -f /etc/lightdm/lightdm.conf ]]; then
  # Fallback: configure lightdm directly
  sed -i "s/^#*autologin-user=.*/autologin-user=${KIOSK_USER}/" /etc/lightdm/lightdm.conf
  echo "[OK] Autologin configured via lightdm."
else
  echo "[!] Could not configure autologin — no supported display manager found."
  echo "    You may need to set up autologin manually."
fi

# ── 3. Create autostart directory ────────────────────────────────────
AUTOSTART_DIR="/home/${KIOSK_USER}/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# ── 4. Kiosk autostart entry ────────────────────────────────────────
echo "[*] Creating kiosk autostart entry..."
cat > "$AUTOSTART_DIR/labsync-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=LabSync Kiosk
Exec=/bin/bash -c 'sleep 5 && ${CHROMIUM_BIN} --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-translate --disable-features=TranslateUI --check-for-update-interval=31536000 --disable-session-crashed-bubble --password-store=basic ${KIOSK_URL}'
X-GNOME-Autostart-enabled=true
EOF

# ── 5. Disable screen blanking ──────────────────────────────────────
echo "[*] Creating screen blanking disable entry..."
cat > "$AUTOSTART_DIR/labsync-disable-blanking.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Disable Screen Blanking
Exec=/bin/bash -c 'xset s off && xset -dpms && xset s noblank'
X-GNOME-Autostart-enabled=true
EOF

# ── 6. Hide cursor with unclutter ────────────────────────────────────
echo "[*] Creating cursor-hide entry..."
cat > "$AUTOSTART_DIR/labsync-hide-cursor.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Hide Cursor
Exec=unclutter -idle 0.5 -root
X-GNOME-Autostart-enabled=true
EOF

# ── 7. Fix ownership ────────────────────────────────────────────────
chown -R "${KIOSK_USER}:${KIOSK_USER}" "/home/${KIOSK_USER}/.config"

# ── Done ─────────────────────────────────────────────────────────────
echo
echo "========================================"
echo "  Kiosk mode configured!"
echo ""
echo "  On next reboot the Pi will:"
echo "    - Auto-login as '$KIOSK_USER'"
echo "    - Launch Chromium in kiosk mode at $KIOSK_URL"
echo "    - Disable screen blanking"
echo "    - Hide the mouse cursor"
echo ""
echo "  Reboot now to start kiosk mode:"
echo "    sudo reboot"
echo "========================================"
