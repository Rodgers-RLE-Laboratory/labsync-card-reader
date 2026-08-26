# LabSync Card Reader

A kiosk app for MIT card check-ins. Users tap their MIT ID card on an HID card reader and the app looks up their identity via the MIT Card API, logs the check-in to Firestore, and displays a welcome message.

Built with Next.js and designed to run full-screen on a Raspberry Pi with the official 7" touchscreen.

## What you need

**Hardware:**

- Raspberry Pi 4 (2GB RAM or more)
- Raspberry Pi official 7" touchscreen display
- USB HID card reader (any reader that emulates keyboard input — sends digits followed by Enter)
- microSD card (16GB or more)
- USB-C power supply for the Pi (5V 3A)
- For initial setup: USB keyboard, USB mouse, HDMI monitor, micro-HDMI to HDMI cable

**Credentials (have these ready before you start):**

- MIT Card API client ID and secret (OAuth2 credentials)
- Firebase service account JSON key file
- NEMO API token and URL (optional, for NEMO area access integration)

## Step 1: Flash Raspberry Pi OS

1. On your computer (not the Pi), download and install [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Insert the microSD card into your computer
3. Open Raspberry Pi Imager and choose:
   - **Device:** Raspberry Pi 4
   - **OS:** Raspberry Pi OS (64-bit) — the **Desktop** version, not Lite
   - **Storage:** your microSD card
4. Click the gear icon (or "Edit Settings") before writing to preconfigure:
   - **Hostname:** something descriptive, e.g. `labsync-kiosk`
   - **Username / password:** set a username (default `pi`) and a password you'll remember
   - **WiFi:** enter your network SSID and password (or plan to use ethernet)
   - **Locale:** set your timezone and keyboard layout
   - **SSH:** enable SSH if you want remote access later
5. Click **Write** and wait for it to finish
6. Eject the microSD card

## Step 2: Initial Pi setup

1. Insert the microSD card into the Pi
2. Connect the HDMI monitor, USB keyboard, and USB mouse
3. Plug in power — the Pi will boot to the desktop
4. Complete any first-boot prompts (language, password confirmation, WiFi if not preconfigured, software updates)
5. Open a terminal (click the terminal icon in the taskbar, or press Ctrl+Alt+T)
6. Verify you have internet access:
   ```
   ping -c 3 google.com
   ```
7. Make sure git is installed (it should be by default):
   ```
   git --version
   ```

## Step 3: Connect the touchscreen

Power off the Pi:

```
sudo shutdown -h now
```

Disconnect the HDMI monitor, keyboard, and mouse. Connect the official 7" touchscreen:

1. Connect the ribbon cable from the display to the Pi's DSI port
2. Connect the display's power jumper wires to the Pi's GPIO pins (5V and GND)
3. Mount the Pi to the back of the display using the standoffs

Refer to the [official touchscreen documentation](https://www.raspberrypi.com/documentation/accessories/display.html) for detailed wiring instructions.

Plug the USB card reader into one of the Pi's USB ports.

Power the Pi back on. The touchscreen should display the desktop. If the display is upside down, you can fix it later (see Troubleshooting below).

**From this point on, you can either work directly on the touchscreen with a USB keyboard, or SSH in from another computer** (`ssh pi@labsync-kiosk.local` or whatever hostname you set).

## Step 4: Copy your Firebase key to the Pi

The install script needs your Firebase service account JSON key file on the Pi. Transfer it using one of these methods:

**Option A — SCP from your computer:**

```
scp firebase-service-account.json pi@labsync-kiosk.local:/home/pi/firebase-service-account.json
```

**Option B — USB drive:**

Copy the JSON file to a USB drive, plug it into the Pi, and copy it:

```
sudo cp /media/pi/USB_DRIVE/firebase-service-account.json /home/pi/firebase-service-account.json
```

The install script will ask for the path to this file. Remember where you put it.

## Step 5: Run the install script

```
curl -fsSL https://raw.githubusercontent.com/Rodgers-RLE-Laboratory/labsync-card-reader/main/install.sh | sudo bash
```

Or if you prefer to inspect the script first:

```
git clone https://github.com/Rodgers-RLE-Laboratory/labsync-card-reader.git
cat labsync-card-reader/install.sh
sudo bash labsync-card-reader/install.sh
```

The script will:

1. Install Node.js 20 if needed
2. Clone the app to `/opt/labsync-card-reader`
3. Build it
4. Prompt you for your credentials:
   - `MIT_CARD_CLIENT_ID` — required
   - `MIT_CARD_CLIENT_SECRET` — required
   - `FIREBASE_SERVICE_ACCOUNT_KEY` — path to the JSON file you copied in Step 4
   - `NEMO_URL` — optional, press Enter to skip
   - `NEMO_API_TOKEN` — optional, press Enter to skip
   - `NEMO_AREA_ID` — optional, press Enter to skip
   - `SITE_TITLE` — the name shown on screen, defaults to "LabSync"
5. Install and start the app as a systemd service

Once it finishes, verify the app is running:

```
sudo systemctl status labsync-card-reader
```

Open Chromium on the Pi and go to `http://localhost:3000` — you should see the "Tap your MIT ID" screen.

## Step 6: Set up kiosk mode

Kiosk mode makes the Pi boot straight into the app full-screen with no desktop, no cursor, and no screen blanking.

```
sudo bash /opt/labsync-card-reader/kiosk.sh
```

Then reboot:

```
sudo reboot
```

The Pi will auto-login, launch Chromium full-screen pointed at the app, hide the cursor, and keep the screen on permanently.

## Managing the app

**Check status:**

```
sudo systemctl status labsync-card-reader
```

**View logs:**

```
sudo journalctl -u labsync-card-reader -f
```

**Restart the app:**

```
sudo systemctl restart labsync-card-reader
```

**Update to the latest version:**

Re-run the install script. It will pull the latest code and rebuild. Your `.env.local` will be preserved (it asks before overwriting).

```
sudo bash /opt/labsync-card-reader/install.sh
```

**Edit environment variables:**

```
sudo nano /opt/labsync-card-reader/.env.local
sudo systemctl restart labsync-card-reader
```

## Exiting kiosk mode

If you need to get back to the desktop (for debugging, configuration, etc.):

1. Press `Alt+F4` to close Chromium
2. Or SSH in from another machine: `ssh pi@labsync-kiosk.local`

To permanently disable kiosk mode, delete the autostart entries and re-enable the login prompt:

```
rm ~/.config/autostart/labsync-kiosk.desktop
rm ~/.config/autostart/labsync-disable-blanking.desktop
rm ~/.config/autostart/labsync-hide-cursor.desktop
sudo raspi-config nonint do_boot_behaviour B1
sudo reboot
```

## Troubleshooting

**Display is upside down:**

Edit `/boot/firmware/config.txt` (or `/boot/config.txt` on older OS versions) and add:

```
lcd_rotate=2
```

Then reboot.

**Touchscreen input is offset or inverted:**

This can happen after rotation. Create or edit `/etc/X11/xorg.conf.d/40-libinput.conf`:

```
Section "InputClass"
    Identifier "calibration"
    MatchProduct "FT5406"
    Option "TransformationMatrix" "-1 0 1 0 -1 1 0 0 1"
EndSection
```

Then reboot.

**App won't start — "Cannot find module" errors:**

The standalone build may be missing static assets. Run:

```
cd /opt/labsync-card-reader
sudo cp -r public .next/standalone/public
sudo cp -r .next/static .next/standalone/.next/static
sudo systemctl restart labsync-card-reader
```

**Card reader not working:**

- Make sure the reader is plugged in before opening the app
- The reader must send digits followed by an Enter key — most HID badge readers do this by default
- Test by opening a text editor on the Pi and swiping a card — you should see numbers appear followed by a newline
- The app expects 5-15 digit card IDs

**Can't reach the app in Chromium:**

Check that the service is running and listening on port 3000:

```
sudo systemctl status labsync-card-reader
curl http://localhost:3000
```

**Screen goes blank after a while (kiosk mode not working):**

Re-run the kiosk setup:

```
sudo bash /opt/labsync-card-reader/kiosk.sh
sudo reboot
```

Or manually disable screen blanking:

```
xset s off
xset -dpms
xset s noblank
```
