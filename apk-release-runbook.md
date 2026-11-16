# Olivia's World APK Runbook (Capacitor)

## 1) Effort and risk summary

- **Architecture complexity**: Low/Medium (WebView wrapper, no rewrite required)
- **Estimated effort for first installable APK**: ~0.5-2 days
- **Main risks**
  1. Mobile audio unlock / autoplay restrictions
  2. Touch timing differences vs desktop browser
  3. Large image memory/perf spikes on lower-end tablets
  4. APK signing/keystore handling for updates

---

## 2) Recommended packaging architecture

Use **Capacitor + Android WebView**:
- Keep game code as-is (`index.html`, `styles.css`, `src`, `assets`, `sfx`)
- Build a static `web/` folder for APK packaging
- Capacitor wraps it into Android app shell

---

## 3) Prerequisites

1. Node.js LTS (18+)
2. Android Studio (SDK + platform tools)
3. Java JDK 17
4. USB debugging enabled on tablet (for direct install tests)

---

## 4) First APK setup steps

Run from [cuppy-land](C:/dev/oliviaworld/cuppy-land) (important: commands assume this working directory):

```bash
npm init -y
npm install @capacitor/core
npm install -D @capacitor/cli
npm install @capacitor/android
```

Initialize Capacitor (with a dedicated web output folder):

```bash
npm exec -- cap init "Olivia's World" "com.oliviaworld.game" --web-dir=web
```

Use the included web-packaging script:

```bash
npm run prepare:web
```

This copies runtime files into `web/`:
- `index.html`
- `styles.css`
- `assets/`
- `sfx/`
- `src/`

Then:

```bash
npm exec -- cap add android
npm exec -- cap copy android
npm exec -- cap open android
```

In Android Studio:
1. Let Gradle sync
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Install generated APK on tablet

---

## 5) Update loop for each change

```bash
# refresh web/ from source files + copy into Android project
npm run cap:copy
npm exec -- cap open android
```

Rebuild/install from Android Studio.

---

## 6) Sideload/install on tablet

### Option A: USB
```bash
adb install -r app-release.apk
```

### Option B: file transfer
1. Copy APK to tablet
2. Open APK file
3. Allow install from source (one-time Android prompt)

---

## 7) Asset scaling analysis (rerun)

Analysis basis:
- world viewport: `1280x800`
- friend render size: `132x132`
- cup size: `260x360`
- sleeve/face/hair/lid/cup layers from CSS and runtime draw sizes

### Recommended export targets (per asset)

| Asset | Current (px) | Current size | Recommended max export | Notes |
|---|---:|---:|---:|---|
| `furball-guy-drawing.png` | 1465x1545 | 3.59 MB | **384x384 PNG/WebP** | Biggest win; currently far above display need |
| `spongebob-stuffy.png` | 1242x1795 | 2.46 MB | **384x512 PNG/WebP** | Tall source; still only rendered at 132x132 |
| `hairy-guy-drawing.png` | 1868x1673 | 2.03 MB | **384x384 PNG/WebP** | Large downscale recommended |
| `hairstyle-summer-hat.png` | 1620x911 | 2.02 MB | **512x288 PNG/WebP** | Display region ~220x128 |
| `bg-olivia-room.jpg` | 2912x1440 | 2.00 MB | **1600x800 JPG/WebP** | Repeat-x background; optimize for 800px height |
| `hairstyle-tiara.png` | 1385x945 | 0.85 MB | **512x320 PNG/WebP** | Display region ~220x128 |
| `cuppyland-splash-horizontal.jpg` | 2752x1536 | 0.65 MB | **1920x1080 JPG/WebP** | Keep quality for first screen |
| `heart-woman.png` | 895x999 | 0.63 MB | **384x384 PNG/WebP** | Friend rendered 132x132 |
| `sleeve-grandparent.png` | 1073x1061 | 0.53 MB | **400x240 PNG/WebP** | Sleeve rendered ~200x110 |
| `heart-man.png` | 1090x922 | 0.50 MB | **384x384 PNG/WebP** | Friend rendered 132x132 |
| `hairstyle-grandpa.png` | 889x746 | 0.32 MB | **512x320 PNG/WebP** | Display region ~220x128 |
| `tricerotops-bead-craft.png` | 616x428 | 0.30 MB | **320x240 PNG/WebP** | Moderate cut |
| `playground-bg.jpg` | 1024x1024 | 0.20 MB | **1024x1024 JPG/WebP** | Already acceptable |
| `olivia-room-headline.png` | 640x294 | 0.15 MB | **640x320 PNG/WebP** | Keep roughly as-is |
| `rocketman-craft.png` | 380x450 | 0.06 MB | **320x384 PNG/WebP** | Small cut optional |
| `pizza-man-craft.png` | 413x450 | 0.06 MB | **320x384 PNG/WebP** | Small cut optional |
| `chocolate-milk-sequence2.png` | 538x502 | 0.06 MB | **320x320 PNG/WebP** | Preview rendered at 188x188 |
| `chocolate-milk-sequence3.png` | 538x502 | 0.05 MB | **320x320 PNG/WebP** | Preview rendered at 188x188 |
| `sleeve-child.png` | 220x216 | 0.03 MB | **220x216** | Keep |
| `chocolate-milk.png` | 221x320 | 0.03 MB | **256x320** | Keep/very small trim |
| `cup-grayscale.png` | 220x275 | 0.03 MB | **220x275** | Keep exact render size |
| `facial-expression-happy.png` | 207x256 | 0.02 MB | **240x256** | Keep |
| `facial-expression-scared.png` | 240x180 | 0.02 MB | **240x180** | Keep |
| `facial-expression-loved.png` | 240x297 | 0.07 MB | **240x297** | Keep |
| `lid-grayscale.png` | 232x149 | 0.02 MB | **232x149** | Keep exact render size |

Vector files (`.svg`) are already efficient; keep as vector.

---

## 8) Recommended optimization order

1. `furball-guy-drawing.png`
2. `spongebob-stuffy.png`
3. `hairy-guy-drawing.png`
4. `hairstyle-summer-hat.png`
5. `bg-olivia-room.jpg`
6. `hairstyle-tiara.png`
7. `sleeve-grandparent.png`
8. `heart-woman.png` / `heart-man.png`

---

## 9) Immediate next action

After creating the `web/` folder, run:

```bash
npm exec -- cap add android
npm exec -- cap copy android
npm exec -- cap open android
```

Then generate the first debug APK and install to tablet for real touch/audio validation.

---

## 10) First debug APK checklist (exact)

1. Prepare web assets:
   ```bash
   npm run cap:copy
   ```
2. Open Android Studio:
   ```bash
   npm exec -- cap open android
   ```
3. In Android Studio:
   - wait for Gradle sync to finish
   - choose build variant `debug`
   - **Build > Build APK(s)**
4. Install debug APK:
   - USB: `adb install -r android\app\build\outputs\apk\debug\app-debug.apk`
   - or transfer file to tablet and open it
5. Playtest on tablet:
   - splash → world select → world open
   - drag/drop interactions
   - chocolate milk 5s flow
   - audio unlock after first tap

---

## 11) First signed release APK checklist (exact)

### A) Create keystore (one time)

From repo root:

```bash
keytool -genkeypair -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias oliviaworld-release
```

Store the keystore safely (backup it). Do **not** lose this file or password if you want future updates to install over old versions.

### B) Configure signing in Android Studio

1. `npm exec -- cap open android`
2. **Build > Generate Signed Bundle / APK**
3. Choose **APK**
4. Select keystore path, alias, and passwords
5. Choose `release` build type
6. Build signed APK

### C) Install release APK on tablet

- USB:
  ```bash
  adb install -r android\app\build\outputs\apk\release\app-release.apk
  ```
- or transfer `app-release.apk` to tablet and install manually

### D) Release sanity checks

- app launches offline
- worlds/audio/interactions all work
- no missing assets
- upgrade install works with `-r` over previous APK
