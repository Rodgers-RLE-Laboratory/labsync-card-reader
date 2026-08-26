# LabSync Card Reader

Based on [MITProjectManus/make-checkin](https://github.com/MITProjectManus/make-checkin).

A kiosk app for MIT card check-ins. Users tap their MIT ID card on an HID card reader and the app looks up their identity via the MIT Card API, logs the check-in to Firestore, and displays a welcome message.

Built with Next.js and designed to run full-screen on a Raspberry Pi with the official 7" touchscreen.

## What you need

**Hardware:**

- Raspberry Pi 4 (2GB RAM or more)
- Raspberry Pi official 7" touchscreen display (DSI ribbon cable + micro-USB power)
- USB HID card reader (any reader that emulates keyboard input — sends digits followed by Enter)
- microSD card (16GB or more)
- USB-C power supply for the Pi (27 W or greater)
- Micro-USB cable or adapter to power the touchscreen
- SmartiPi Touch 2 case
- USB keyboard for initial setup (an HDMI monitor and micro-HDMI cable are only needed if something goes wrong)

**Stand (optional):**

The SmartiPi Touch 2 case is VESA 75 compatible. The following parts make a compact stand using a cheap iPad stand:

- VESA 75 mounting adapter bracket (3D-printable files in this repo)
- 3mm laser-cut acrylic adapter plate (constrains the square key from the stand; laser-cut acrylic is sturdier than 3D printed)
- iPad stand with removable spring-loaded bracket, such as Maxonar iPad Stand Holder — remove the iPad bracket and attach the acrylic plate and VESA adapter instead
- 4x M4 bolts, 25mm, socket or button head

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

## Step 2: Assemble the hardware

Before first boot, wire up the touchscreen and card reader with the Pi unpowered.

1. Insert the microSD card into the Pi
2. Connect the ribbon cable from the display to the Pi's **DSI port**. The Pi 4 has two identical-looking ribbon cable connectors — use the one labeled "DISPLAY" (between the HDMI ports and the audio jack), **not** the one labeled "CAMERA".
3. Connect the display's **micro-USB power cable** to a power source (a separate USB power adapter — do not use the Pi's USB ports or a splitter cable, as this can cause overcurrent errors)
4. Mount the Pi to the back of the display using the SmartiPi Touch 2 case and included standoffs
5. Plug the USB card reader into one of the Pi's USB ports
6. Connect a USB keyboard to one of the Pi's USB ports

The display gets its video signal through the DSI ribbon cable and its power through the micro-USB port — both must be connected.

Refer to the [official touchscreen documentation](https://www.raspberrypi.com/documentation/accessories/display.html) for detailed wiring.

## Step 3: Initial Pi setup

Plug in the Pi's USB-C power cable. The desktop should appear on the touchscreen. If the screen stays blank, see Troubleshooting below — you may need to connect an HDMI monitor temporarily to diagnose.

1. Complete any first-boot prompts (language, password confirmation, WiFi if not preconfigured)
2. Open a terminal (tap the terminal icon in the taskbar, or press Ctrl+Alt+T on the keyboard)
3. Verify you have internet access:
   ```
   ping -c 3 google.com
   ```
4. Apply system updates. The image from Raspberry Pi Imager may be several months out of date:
   ```
   sudo apt update
   sudo apt upgrade --autoremove
   ```
   If connecting remotely via Raspberry Pi Connect, update `rpi-connect` first (the full upgrade may disconnect the session):
   ```
   sudo apt update
   sudo apt install --only-upgrade rpi-connect
   ```
   Wait for the Pi to reconnect, then run the full upgrade:
   ```
   sudo apt upgrade --autoremove
   ```
   The Pi may reboot after updates complete.
5. Disable the on-screen keyboard so it doesn't appear during kiosk operation:

   **Raspberry Pi Menu > Preferences > Control Centre > Display > On-screen Keyboard > Disabled**

6. **Fix the Ethernet/OmniKey conflict (ethernet deployments only):**

   The OmniKey 5427CK card reader presents as both a USB HID device and a USB Ethernet adapter. When connected, the Pi assigns the default `netplan-eth0` profile to the reader's USB Ethernet interface instead of the onboard NIC, leaving the real ethernet port disconnected. Fix this by deleting the misconfigured profile and creating correct ones:

   ```
   # Delete the profile that got attached to the wrong interface
   sudo nmcli connection delete netplan-eth0

   # Create a profile for the real onboard ethernet
   sudo nmcli connection add type ethernet con-name "Wired" ifname eth0 ipv4.method auto connection.autoconnect yes

   # Create a profile for the OmniKey's USB-Ethernet interface
   sudo nmcli connection add type ethernet con-name usb0-omnikey ifname usb0 ipv4.method auto connection.autoconnect yes

   # Bring both up
   sudo nmcli connection up "Wired"
   sudo nmcli connection up usb0-omnikey
   ```

   Verify the result:

   ```
   nmcli device status
   ip a show eth0
   ip a show usb0
   ```

   You should see `eth0` connected via `Wired` with a LAN IP from your DHCP server, and `usb0` connected via `usb0-omnikey` with an IP in the `192.168.63.x` range (the reader's local subnet).

7. Make sure git is installed (it should be by default):
   ```
   git --version
   ```

If the display is upside down, see Troubleshooting below.

**From this point on, you can either work directly on the touchscreen with the USB keyboard, or SSH in from another computer** (`ssh pi@labsync-kiosk.local` or whatever hostname you set).

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

**Touchscreen stays blank after disconnecting HDMI:**

SSH in from another computer: `ssh pi@labsync-kiosk.local`

Check that the DSI display is detected:

```
DISPLAY=:0 xrandr
```

If it only shows HDMI outputs, the ribbon cable may not be seated properly. Power off, reseat the cable, and try again.

If the display is detected but not active, edit `/boot/firmware/config.txt` and add `display_default_lcd=1` under `[all]`, then reboot.

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
