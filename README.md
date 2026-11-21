# 1990s Television Live Show — a RapidRAW plugin

A clean-room RapidRAW effect for the polished look of **1990s TV shows and live
music performances**: Betacam-era colour/detail, broadcast aperture correction,
PAL/NTSC SD texture, glowing stage lights and configurable optical cross-screen
**light stars**. It deliberately avoids VHS tracking damage, CRT curvature and
fake retro overlays.

> Target: **RapidRAW v1.7.0** (Furka Rendering Engine).

## Install into a source checkout

```sh
git -c core.autocrlf=false -c core.eol=lf clone --depth 1 --branch v1.7.0 \
  https://github.com/CyberTimon/RapidRAW.git RapidRAW
npm install
node installer/install.mjs --rapidraw ../RapidRAW --dry-run
node installer/install.mjs --rapidraw ../RapidRAW
cd ../RapidRAW && npm install && npm run tauri dev
```

Hash-safe uninstall:

```sh
node installer/uninstall.mjs --rapidraw ../RapidRAW
```

## Controls

- Camera Softness and electronic Aperture / Edge Detail
- Chroma Bleed and reduced colour bandwidth
- Stage Colour Punch, Black Lift, Highlight Roll-off and warm/cool Stage Warmth
- broad Light Diffusion with threshold
- optical **4-, 6- or 8-point Light Stars**, length and angle
- optional clean Video Noise and Interlacing
- Off, PAL 576 or NTSC 480 SD resampling
- master Amount

Presets: **Music Special**, **Variety Show**, **Live Concert** and
**Clean Betacam SP**.

## Development verification

Run in order: `npm test`, installer dry-run, real install, `cargo check`, WGSL
validation with Naga, `npx tsc --noEmit`, `npm run build`, then `npm run tauri
dev` and a rendered GUI smoke test.

## Licence

AGPL-3.0-or-later, matching RapidRAW. See `LICENSE` and `NOTICE.md`.
