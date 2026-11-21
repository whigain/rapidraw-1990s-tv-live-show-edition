# Research basis: 1990s TV shows and live music

The target is a **professional studio/acquisition look**, not consumer VHS or a
CRT-display simulation.[1][2] Sony's own history describes Betacam SP as a broadcast
Betacam development using metal tape and wider signal bandwidth, while Sony's
1990 report documents Betacam SP products and three-chip CCD cameras in the
period reference family.[1][2]

The SD stage follows ITU-R BT.601 as the component-video abstraction: separate
luminance and colour-difference processing with the familiar 720-sample studio
raster.[3] That motivates keeping luma detail crisper than chroma rather than
adding unstable composite/VHS damage.[3]

Tiffen's diffusion guide distinguishes optical diffusion by its treatment of
contrast, fine detail, highlight flare and halation.[4] The plugin therefore uses
a small camera-softness component plus an independent thresholded highlight
halo instead of one global blur.[4]

For the live-show cross-screen look, directional star rays are generated in a
separate bright-pass convolution.[5] Blender's compositor glare shaders were used
as a structural reference for distinct highlight, bloom and simple-star passes;
Unity URP's bloom shader was reviewed for bounded-resolution highlight
prefiltering and blur/upsample practice. The WGSL code here is an independent
clean-room implementation.[5][6]

## Resulting effect stack

1. Optional PAL 576 / NTSC 480 SD resampling.[3]
2. Mild camera softness plus restrained luma aperture correction.[1][2]
3. Stronger chroma low-pass with a small horizontal colour delay.[1][2][3]
4. Saturated stage colours, black lift and firm highlight roll-off.[1][2]
5. Thresholded broad light diffusion.[4][6]
6. Independent 4/6/8-point optical star rays; four points are the default.[5]
7. Optional low-level image-space video noise.[1][2]
8. Interlace mode applies vertical field-safe luma filtering only—no fake
   scanlines, combing or alternating-line brightness.[3]
9. No tracking errors, head switching, CRT mask, curvature or fake overlay.

## Sources

[1] https://www.sony.com/ja/SonyInfo/CorporateInfo/History/SonyHistory/2-04.html — Sony History: Betacam and Betacam SP
[2] https://www.sony.com/en/SonyInfo/IR/library/ar/8ido18000005flzv-att/1990-E.pdf — Sony Annual Report 1990
[3] https://www.itu.int/rec/R-REC-BT.601 — ITU-R BT.601
[4] https://tiffen.com/pages/diffusion-selection-guide — Tiffen Diffusion Selection Guide
[5] https://github.com/blender/blender/tree/main/source/blender/compositor/shaders — Blender compositor glare shaders
[6] https://github.com/Unity-Technologies/Graphics/blob/master/Packages/com.unity.render-pipelines.universal/Shaders/PostProcessing/Bloom.shader — Unity URP Bloom shader
