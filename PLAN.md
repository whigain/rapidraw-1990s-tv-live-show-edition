# Implementation plan

## Look model

1. Optional PAL 576 / NTSC 480 area downsample.
2. Small camera blur plus electronic luma aperture correction.
3. Stronger chroma blur with a slight horizontal colour delay.
4. Saturated stage colour, black lift and soft highlight clipping.
5. Thresholded bright pass feeding broad diffusion.
6. Directional 4/6/8-point cross-screen star sampling on a bounded 720-line canvas.
7. Optional image-space noise and interlace modulation.
8. Master blend over the SD-resampled source.

## Integration

The plugin adds `Group::Live90s`, `effects/live90s.rs`, `shaders/live90s.wgsl`,
`Live90sSection.tsx`, presets, defaults/reconciliation, cache keys, i18n and a
copy/paste group through anchored RapidRAW-v1.7.0 patches.

## Verification order

1. `npm test`
2. installer `--dry-run`
3. real install and idempotent second install
4. `cargo check`
5. Naga validation of plugin shader + `compute_common.wgsl`
6. `npx tsc --noEmit` and `npm run build`
7. `npm run tauri dev` plus GUI smoke for presets, star point modes, angle,
   diffusion, SD/interlace/noise and 25/50/100/200% zoom.
