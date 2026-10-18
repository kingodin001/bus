# Автобусная суета / BusSpark

Offline Android bus-parking puzzle inspired by the user-supplied gameplay reference. Current source version: **0.2.0**, **three levels**.

## Install

APK 0.2.0 must be built and signed using the private original release key; version 0.1.0 stays in main until verified. Package: `pro.busspark.game`. Android 8.0+ with an up-to-date Android System WebView and OpenGL ES 3.0. The APK is signed with the project's private release key; the key is not in this repository.

## Included

- Original city artwork, Russian main menu, level selection.
- Real-time 3D buses with directional exits, obstruction checks, wheels, windows, headlights and roof arrows.
- Two passenger queues, matching by color, four parking spaces, unlockable spaces and VIP parking.
- Three deterministic solvable levels: 9, 16 and 23 buses; 392, 688 and 1000 passengers.
- Boarding and departure animations, particles, synthesized sound, optional vibration.
- Pause, restart, failure/continue, victory and local progress saving.
- Working coin shop, daily reward, timed supplies, starter gift, daily wheel and a coin-funded bonus pack.
- VIP, queue ordering and vehicle reshuffling boosters.
- All assets bundled offline. No network permission, trackers, accounts, advertising or real-money payments.

This is an independently implemented first version, not extracted source/assets from Bus Fever Party. The supplied clip does not establish all original game rules. Shop behavior and unshown screens are original implementations. Pixel-identical fidelity and performance on a physical Android device have not been verified.

## Build

The Android host is Java; game rendering uses pinned Three.js r160, with local HTML/CSS/JavaScript and generated menu artwork. No external CDN is accessed at runtime.

Use Android Studio/Gradle, or the standalone SDK packager:

```bash
export ANDROID_JAR=/path/to/android-sdk/platforms/android-35/android.jar
export BUILD_TOOLS=/path/to/android-sdk/build-tools/35.0.0
export BUS_KEYSTORE=/private/path/bus-release.jks
export BUS_KEY_ALIAS=bus
# Supply BUS_KEY_PASSWORD through your secure environment.
python3 scripts/build-apk.py
```

Keep the original signing key for future updates. It was saved separately as `BusSpark-private-signing-backup.zip` in the owner's private files. Never upload that archive or its password to this public repository.

## Verification

```bash
node tests/rules.cjs
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium node tests/browser.cjs
```

The browser suite checks complete playthroughs, blockage, color/capacity conservation, rewards, menus, real pointer selection, boosters, local persistence and responsive sizing. See [QA notes](docs/QA.md) for scope and limits.

## Assets

Original game geometry and UI: `app/src/main/assets/graphics.js`, `icons.js`, `style.css`.
Generated city background: `app/src/main/assets/art/menu-city.png`; art direction in [docs/art-direction.md](docs/art-direction.md).
Three.js and DejaVu font notices are bundled beside those dependencies.

## Version 0.2.0

Brighter buses and characters, closer camera, three lengths with capacities 16 / 24 / 40, four passengers per walking queue row, and immersive Android full screen. The update is intended to be signed with the **original** release key so it installs over 0.1.0. Do not distribute CI-test-signed builds as updates.
