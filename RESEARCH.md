# Research basis: 1990s TV shows and live music

The plugin models a **professional broadcast acquisition/production look**, not a
consumer VHS or CRT effect. Sony's period reports place Digital Betacam in 1993
and Betacam SX in 1996, supporting a 1990s component/digital broadcast family as
the technical reference rather than damaged home-video playback.[3][4]

Tiffen's diffusion material describes diffusion families in terms of reduced
contrast, controlled highlight flare and varying halation/softening. The plugin
therefore separates a broad thresholded light-diffusion pass from camera
softness instead of using one global blur.[1][2]

For concert and variety-show lighting, the distinct cross-screen look is modeled
as a separate directional star pass. A public OpenGL starburst implementation
was reviewed as an algorithmic reference, but this plugin uses an independent,
minimal WGSL implementation with selectable two, three or four axes (4/6/8
visible rays), threshold, angle and decay.[5]

## Resulting effect stack

1. PAL 576 / NTSC 480 resolution option.[6]
2. Mild camera softness and luma aperture correction.[3][4]
3. Stronger chroma low-pass plus horizontal chroma delay.[3][4][6]
4. Saturated stage colours, black lift and soft highlight roll-off.[1][3]
5. Bright-pass light diffusion.[1][2]
6. Independent 4/6/8-point optical star rays.[2][5]
7. Optional image-space video noise and interlace modulation.[3][4]
8. No tracking errors, head switching, CRT mask, curvature or fake overlay.

## Sources

[1] https://tiffen.com/pages/diffusion-selection-guide — Tiffen Diffusion Filter Selection Guide
[2] https://tiffen.com/pages/filters — Tiffen Optical Filters
[3] https://www.sony.com/en/SonyInfo/IR/library/presen/ar/1997-E.pdf — Sony Annual Report 1997
[4] https://www.sony.com/en/SonyInfo/IR/library/presen/ar/1998-E.pdf — Sony Annual Report 1998
[5] https://github.com/benpm/opengl_lens_flare/blob/ce0010bdd81a3c6d8c8c6278af7abecb8ec71d52/shaders/starburst.glsl — OpenGL lens flare starburst shader
[6] https://github.com/danmons/retronas/wiki/Video-Signal-Standards — RetroNAS Video Signal Standards
