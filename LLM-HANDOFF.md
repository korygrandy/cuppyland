# Olivia's World — LLM Hand-off

## 1) Project snapshot
- Platform: tablet-first web game, landscape-only.
- Runtime: plain HTML/CSS/JS (no bundler currently).
- Entry point: [index.html](C:/dev/oliviaworld/cuppy-land/index.html)
- Main orchestration: [app.js](C:/dev/oliviaworld/cuppy-land/src/core/app.js)

## 2) Current architecture
- Core:
  - [app.js](C:/dev/oliviaworld/cuppy-land/src/core/app.js)
  - [game-config.js](C:/dev/oliviaworld/cuppy-land/src/core/game-config.js)
- State:
  - [cup-state-store.js](C:/dev/oliviaworld/cuppy-land/src/state/cup-state-store.js)
- Interaction:
  - [interaction-helpers.js](C:/dev/oliviaworld/cuppy-land/src/interaction/interaction-helpers.js)
  - [cup-drag-helpers.js](C:/dev/oliviaworld/cuppy-land/src/interaction/cup-drag-helpers.js)
- Controllers:
  - [cup-pointer-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/cup-pointer-controller.js)
  - [inventory-interaction-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/inventory-interaction-controller.js)
  - [screen-world-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/screen-world-controller.js)
  - [render-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/render-controller.js)
  - [bootstrap-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/bootstrap-controller.js)
  - [game-rules-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/game-rules-controller.js)
- Audio:
  - [audio-engine.js](C:/dev/oliviaworld/cuppy-land/src/audio/audio-engine.js)
  - [audio.js](C:/dev/oliviaworld/cuppy-land/src/audio/audio.js)
- UI:
  - [inventory.js](C:/dev/oliviaworld/cuppy-land/src/ui/inventory.js)

## 3) Core gameplay invariants
1. Per-world isolation.
2. Per-cup state isolation.
3. Active dragged/selected cup is brought to front.
4. Inventory click targets selected cup; drag targets hovered cup + valid zone.
5. Duplicate sleeve apply is invalid.
6. Hair/lid coupling:
   - Hair can be removed independently.
   - Removing lid removes lid + hair.
   - Applying hair to lidless cup auto-restores lid and anchors hair.

## 4) Folder structure (implemented)
```text
cuppy-land/
  src/
    core/
      app.js
      game-config.js
    state/
      cup-state-store.js
    interaction/
      interaction-helpers.js
      cup-drag-helpers.js
    controllers/
      cup-pointer-controller.js
      inventory-interaction-controller.js
      screen-world-controller.js
      render-controller.js
      bootstrap-controller.js
      game-rules-controller.js
    audio/
      audio-engine.js
      audio.js
    ui/
      inventory.js
  assets/
  styles.css
  index.html
```

`index.html` script order is dependency-sensitive in this no-bundler setup.

## 5) Manual playtest checklist
- Splash -> world select -> world open.
- Multi-cup drag order (active cup stays on top).
- Hair remove/reapply by click and drag.
- Lid removed then hair apply (auto lid restore).
- Sleeve apply/remove + expression behavior.
- Trash/out-of-bounds removal behavior.
- World switching with no state leakage.

## 6) Production build and deploy workflow
### 6.1 Browser web bundle
The generated `web/` directory is the public browser deployable output. It contains the static HTML/CSS/JS bundle for the game and is what should be uploaded to the hosted site, not the raw source tree.

Generate it:
```powershell
Set-Location "C:\dev\oliviaworld\cuppy-land"
npm run prepare:web
```

This writes the browser-ready output to:
- [web](./web)

Recommended public hosting structure:
```text
/cupplandapp/
  index.html
  app-release.apk
  manifest.webmanifest
  service-worker.js
  icons/
  ...all generated files copied from web/
```

Note: do not upload the raw `src/` tree to the public browser site in production. Upload the generated `web/` bundle instead.

### 6.2 Android APK build
Build the Android release package from the project:
```powershell
Set-Location "C:\dev\oliviaworld\cuppy-land\android"
$env:JAVA_HOME = "C:\Users\KG1\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleRelease
```

Unsigned output:
- `android/app/build/outputs/apk/release/app-release-unsigned.apk`

The signed deployment APK should be created with the release keystore before publishing. Example:
```powershell
$env:JAVA_HOME = "C:\Users\KG1\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$apksigner = "C:\Users\KG1\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"
$keystore = "C:\dev\oliviaworld\cuppy-land\android\my-release-key.keystore"
$alias = "cuppyland"
$unsigned = "C:\dev\oliviaworld\cuppy-land\android\app\build\outputs\apk\release\app-release-unsigned.apk"
$signed = "C:\dev\oliviaworld\cuppy-land\android\app\build\outputs\apk\release\app-release.apk"

& $apksigner sign --ks $keystore --ks-key-alias $alias --out $signed $unsigned
& $apksigner verify $signed
```

Final public APK artifact:
- `android/app/build/outputs/apk/release/app-release.apk`

### 6.3 Public deployment flow
1. Generate the browser bundle in `web/`.
2. Upload the contents of `web/` to the HTTPS host folder for the public site.
3. Upload the signed APK to the same folder as `app-release.apk`.
4. Publish a small download page like `cupplandapp/index.html` that links to `/cupplandapp/app-release.apk`.
5. Confirm the public path works:
   - `https://www.kgenterprises.com/cuppyland/`
   - `https://www.kgenterprises.com/cuppylandapp/`
   - `https://www.kgenterprises.com/cuppylandapp/app-release.apk`

Live host layout in use:
```text
/cuppyland/         => browser game web app
/cuppylandapp/      => APK download page and signed APK
```

Important: the FTP hostname must remain direct (DNS only) and not proxied through Cloudflare. Keep `ftp.kgenteprises.com` off the Cloudflare proxy for file transfer access.

## 7) Build and test log review workflow
The repo currently does not have a formal automated test suite, so validation logs are the primary review artifact for release checks.

Create a dedicated log folder:
```powershell
New-Item -ItemType Directory -Force -Path "C:\dev\oliviaworld\cuppy-land\logs" | Out-Null
```

Capture the browser build:
```powershell
Set-Location "C:\dev\oliviaworld\cuppy-land"
npm run prepare:web *> "C:\dev\oliviaworld\cuppy-land\logs\web-build.log" 2>&1
```

Capture the Android release build:
```powershell
Set-Location "C:\dev\oliviaworld\cuppy-land\android"
$env:JAVA_HOME = "C:\Users\KG1\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleRelease *> "C:\dev\oliviaworld\cuppy-land\logs\android-release.log" 2>&1
```

Capture device logs for tablet validation:
```powershell
& "C:\Users\KG1\AppData\Local\Android\Sdk\platform-tools\adb.exe" logcat -d > "C:\dev\oliviaworld\cuppy-land\logs\device-log.txt"
```

Review the latest output:
```powershell
Get-Content "C:\dev\oliviaworld\cuppy-land\logs\android-release.log" -Tail 80
Get-Content "C:\dev\oliviaworld\cuppy-land\logs\device-log.txt" -Tail 80
```

These logs should be retained alongside each deployment attempt so the latest build and QA status can be reviewed before the next release.

## 8) Deployment checklist before public launch
- Release APK signed and verified.
- `web/` bundle generated and uploaded to host.
- HTTPS site is live and redirects work.
- `ftp.kgenteprises.com` is still functional and not proxied through Cloudflare.
- APK install link works on a real tablet.
- Device log reviewed for runtime issues after install.
- Download page is hosted under `/cupplandapp/` and references the signed APK.

## 9) Current live deployment status (as of last release)
- Browser app URL: `https://www.kgenterprises.com/cuppyland/`
- APK download page: `https://www.kgenterprises.com/cuppylandapp/`
- APK file: `https://www.kgenterprises.com/cuppylandapp/app-release.apk`
- Hosting split: `/cuppyland/` for the web app, `/cuppylandapp/` for the APK and download page.
- Build artifacts: `/logs/web-build.log`, `/logs/android-release.log`, `/logs/device-log.txt`.
- Review method: `Get-Content ... -Tail 80` in PowerShell for the latest log output.
- Current known state: no formal automated test suite is committed; deployment validation relies on build logs and live smoke tests on the tablet.
