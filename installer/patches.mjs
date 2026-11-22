// patches.mjs — 1990s Television Live Show plugin for RapidRAW.
//
// Declarative patch set consumed by install.mjs / uninstall.mjs. Built against
// RapidRAW v1.7.1 ("Furka Rendering Engine"). Every anchor was verified
// against the v1.7.1 source tree.
//
// Each TEXT_PATCHES entry:
//   - file: path relative to RapidRAW root
//   - id: short identifier used in logs
//   - anchor: verbatim LF string that must exist in the current source
//   - mode: 'insertAfter' | 'insertBefore' | 'replace'
//   - payload: text to insert/replace with
//   - alreadyApplied: string proving the patch is already present (idempotency)

export const PLUGIN_VERSION = '0.2.0';
export const BACKUP_DIR = '.live90s-plugin-backup';
export const MANIFEST_FILE = '.live90s-plugin-manifest.json';

const LIVE90S_KEY_LIST = `                "live90sAmount",
                "live90sSoftness",
                "live90sDetail",
                "live90sChromaBleed",
                "live90sColorPunch",
                "live90sBlackLift",
                "live90sHighlightRolloff",
                "live90sDiffusion",
                "live90sDiffusionThreshold",
                "live90sStarAmount",
                "live90sStarLength",
                "live90sStarPoints",
                "live90sStarAngle",
                "live90sWarmth",
                "live90sVideoNoise",
                "live90sInterlace",
                "live90sInterlaceStrength",
                "live90sSdLook",
                "live90sPreset",
                "live90sSeed",
`;

const cacheHashBlock = (marker) =>
  `    // ${marker}\n` +
  '    let live90s_enabled = is_effect_enabled(adjustments, "live90s", "live90sEnabled");\n' +
  '    live90s_enabled.hash(&mut hasher);\n' +
  '    if live90s_enabled {\n' +
  '        hash_effect_keys(\n' +
  '            adjustments,\n' +
  '            &[\n' +
  LIVE90S_KEY_LIST +
  '            ],\n' +
  '            &mut hasher,\n' +
  '        );\n' +
  '    }\n';

// --------------------------------------------------------------------
// New files copied verbatim into the tree.
// --------------------------------------------------------------------
export const COPY_FILES = [
  {
    from: 'src-tauri/src/effects/live90s.rs',
    to: 'src-tauri/src/effects/live90s.rs',
  },
  {
    from: 'src-tauri/src/shaders/live90s.wgsl',
    to: 'src-tauri/src/shaders/live90s.wgsl',
  },
  {
    from: 'src/components/adjustments/sections/Live90sSection.tsx',
    to: 'src/components/adjustments/sections/Live90sSection.tsx',
  },
  {
    from: 'src/utils/live90s.ts',
    to: 'src/utils/live90s.ts',
  },
];

// --------------------------------------------------------------------
// Anchored text patches.
// --------------------------------------------------------------------
export const TEXT_PATCHES = [
  // ---- Rust: register the effect module -----------------------------
  {
    file: 'src-tauri/src/effects/mod.rs',
    id: 'rust-mod-live90s',
    anchor: 'pub mod relight;',
    mode: 'insertAfter',
    alreadyApplied: 'pub mod live90s;',
    payload: '\npub mod live90s;',
  },

  // ---- Rust: add Group::Live90s to the compute pipeline -----------
  {
    file: 'src-tauri/src/render/gpu/compute.rs',
    id: 'rust-group-enum',
    anchor: '    LensBlur,\n    Light,\n}',
    mode: 'replace',
    alreadyApplied: '    Live90s,\n}',
    payload: '    LensBlur,\n    Light,\n    Live90s,\n}',
  },
  {
    file: 'src-tauri/src/render/gpu/compute.rs',
    id: 'rust-group-all',
    anchor:
      '    const ALL: [Group; 6] = [\n' +
      '        Group::Common,\n' +
      '        Group::Transform,\n' +
      '        Group::Relight,\n' +
      '        Group::Fog,\n' +
      '        Group::LensBlur,\n' +
      '        Group::Light,\n' +
      '    ];',
    mode: 'replace',
    alreadyApplied: '[Group; 7]',
    payload:
      '    const ALL: [Group; 7] = [\n' +
      '        Group::Common,\n' +
      '        Group::Transform,\n' +
      '        Group::Relight,\n' +
      '        Group::Fog,\n' +
      '        Group::LensBlur,\n' +
      '        Group::Light,\n' +
      '        Group::Live90s,\n' +
      '    ];',
  },
  {
    file: 'src-tauri/src/render/gpu/compute.rs',
    id: 'rust-group-array-size',
    anchor: '    groups: [OnceLock<HashMap<&\'static str, wgpu::ComputePipeline>>; 6],',
    mode: 'replace',
    alreadyApplied: 'wgpu::ComputePipeline>>; 7]',
    payload: '    groups: [OnceLock<HashMap<&\'static str, wgpu::ComputePipeline>>; 7],',
  },
  {
    file: 'src-tauri/src/render/gpu/compute.rs',
    id: 'rust-group-source',
    anchor:
      '                    "lt_flare",\n' +
      '                ],\n' +
      '            ),\n' +
      '        }\n' +
      '    }',
    mode: 'replace',
    alreadyApplied: 'Group::Live90s => (',
    payload:
      '                    "lt_flare",\n' +
      '                ],\n' +
      '            ),\n' +
      '            Group::Live90s => (\n' +
      '                include_str!("../../shaders/live90s.wgsl"),\n' +
      '                &["ls90_bright", "ls90_star", "ls90_combine"],\n' +
      '            ),\n' +
      '        }\n' +
      '    }',
  },

  // ---- Rust: dispatch the effect in the render pipeline -------------
  {
    file: 'src-tauri/src/render/source.rs',
    id: 'rust-dispatch-live90s',
    anchor:
      '            if let Some(job) = crate::effects::lens_blur::prepare(\n' +
      '                adjustments,\n' +
      '                transform.warp.as_ref(),\n' +
      '                working_size,\n' +
      '            ) {\n' +
      '                stage(enc, &mut current, working_size, &|enc, src, dst| {\n' +
      '                    crate::effects::lens_blur::encode(enc, &job, src, dst)\n' +
      '                });\n' +
      '            }',
    mode: 'insertAfter',
    alreadyApplied: 'crate::effects::live90s::prepare',
    payload:
      '\n            if let Some(job) =\n' +
      '                crate::effects::live90s::prepare(adjustments, working_size, source.size)\n' +
      '            {\n' +
      '                stage(enc, &mut current, working_size, &|enc, src, dst| {\n' +
      '                    crate::effects::live90s::encode(enc, &job, src, dst)\n' +
      '                });\n' +
      '            }',
  },

  // ---- Rust: cache hashing so sliders invalidate the preview --------
  {
    file: 'src-tauri/src/render/cache_utils.rs',
    id: 'rust-cache-effects-hash',
    anchor:
      '        hash_orientation(adjustments, &mut hasher);\n' +
      '    }\n' +
      '\n' +
      '    hasher.finish()\n' +
      '}\n' +
      '\n' +
      'pub fn calculate_thumbnail_source_hash',
    mode: 'replace',
    alreadyApplied: '// live90s-plugin:cache-effects',
    payload:
      '        hash_orientation(adjustments, &mut hasher);\n' +
      '    }\n' +
      '\n' +
      cacheHashBlock('live90s-plugin:cache-effects') +
      '\n' +
      '    hasher.finish()\n' +
      '}\n' +
      '\n' +
      'pub fn calculate_thumbnail_source_hash',
  },
  {
    file: 'src-tauri/src/render/cache_utils.rs',
    id: 'rust-cache-transform-hash',
    anchor:
      '    hash_ai_patches(adjustments, &mut hasher);\n' +
      '    hash_ai_denoise(adjustments, &mut hasher);\n' +
      '    hash_negative_conversion(adjustments, &mut hasher);\n' +
      '\n' +
      '    hasher.finish()\n' +
      '}\n' +
      '\n' +
      'pub fn calculate_full_job_hash',
    mode: 'replace',
    alreadyApplied: '// live90s-plugin:cache-transform',
    payload:
      '    hash_ai_patches(adjustments, &mut hasher);\n' +
      '    hash_ai_denoise(adjustments, &mut hasher);\n' +
      '    hash_negative_conversion(adjustments, &mut hasher);\n' +
      '\n' +
      cacheHashBlock('live90s-plugin:cache-transform') +
      '\n' +
      '    hasher.finish()\n' +
      '}\n' +
      '\n' +
      'pub fn calculate_full_job_hash',
  },

  // ---- TS: Effect enum ----------------------------------------------
  {
    file: 'src/utils/adjustments.ts',
    id: 'ts-effect-enum',
    anchor: "  MotionBlurType = 'motionBlurType',",
    mode: 'insertAfter',
    alreadyApplied: "Live90sEnabled = 'live90sEnabled'",
    payload: `
  /* live90s-plugin */
  Live90sEnabled = 'live90sEnabled',
  Live90sAmount = 'live90sAmount',
  Live90sSoftness = 'live90sSoftness',
  Live90sDetail = 'live90sDetail',
  Live90sChromaBleed = 'live90sChromaBleed',
  Live90sColorPunch = 'live90sColorPunch',
  Live90sBlackLift = 'live90sBlackLift',
  Live90sHighlightRolloff = 'live90sHighlightRolloff',
  Live90sDiffusion = 'live90sDiffusion',
  Live90sDiffusionThreshold = 'live90sDiffusionThreshold',
  Live90sStarAmount = 'live90sStarAmount',
  Live90sStarLength = 'live90sStarLength',
  Live90sStarPoints = 'live90sStarPoints',
  Live90sStarAngle = 'live90sStarAngle',
  Live90sWarmth = 'live90sWarmth',
  Live90sVideoNoise = 'live90sVideoNoise',
  Live90sInterlace = 'live90sInterlace',
  Live90sInterlaceStrength = 'live90sInterlaceStrength',
  Live90sSdLook = 'live90sSdLook',
  Live90sPreset = 'live90sPreset',
  Live90sSeed = 'live90sSeed',
`,
  },

  // ---- TS: Adjustments interface ------------------------------------
  {
    file: 'src/utils/adjustments.ts',
    id: 'ts-adjustments-interface',
    anchor: '  motionBlurType: MotionBlurType;\n  fogAmount: number;',
    mode: 'replace',
    alreadyApplied: 'live90sEnabled: boolean;',
    payload: `  motionBlurType: MotionBlurType;
  live90sEnabled: boolean;
  live90sAmount: number;
  live90sSoftness: number;
  live90sDetail: number;
  live90sChromaBleed: number;
  live90sColorPunch: number;
  live90sBlackLift: number;
  live90sHighlightRolloff: number;
  live90sDiffusion: number;
  live90sDiffusionThreshold: number;
  live90sStarAmount: number;
  live90sStarLength: number;
  live90sStarPoints: '4' | '6' | '8';
  live90sStarAngle: number;
  live90sWarmth: number;
  live90sVideoNoise: number;
  live90sInterlace: boolean;
  live90sInterlaceStrength: number;
  live90sSdLook: 'off' | 'pal576' | 'ntsc480';
  live90sPreset: 'musicSpecial' | 'variety' | 'concert' | 'cleanBetacam' | 'custom';
  live90sSeed: number;
  fogAmount: number;`,
  },

  // ---- TS: normalizeLoadedAdjustments reconciliation ----------------
  {
    file: 'src/utils/adjustments.ts',
    id: 'ts-merge-defaults',
    anchor: '    fogTint: loadedAdjustments.fogTint ?? INITIAL_ADJUSTMENTS.fogTint,',
    mode: 'insertAfter',
    alreadyApplied: 'live90sEnabled: loadedAdjustments.live90sEnabled',
    payload: `
    live90sEnabled: loadedAdjustments.live90sEnabled ?? INITIAL_ADJUSTMENTS.live90sEnabled,
    live90sAmount: loadedAdjustments.live90sAmount ?? INITIAL_ADJUSTMENTS.live90sAmount,
    live90sSoftness: loadedAdjustments.live90sSoftness ?? INITIAL_ADJUSTMENTS.live90sSoftness,
    live90sDetail: loadedAdjustments.live90sDetail ?? INITIAL_ADJUSTMENTS.live90sDetail,
    live90sChromaBleed: loadedAdjustments.live90sChromaBleed ?? INITIAL_ADJUSTMENTS.live90sChromaBleed,
    live90sColorPunch: loadedAdjustments.live90sColorPunch ?? INITIAL_ADJUSTMENTS.live90sColorPunch,
    live90sBlackLift: loadedAdjustments.live90sBlackLift ?? INITIAL_ADJUSTMENTS.live90sBlackLift,
    live90sHighlightRolloff: loadedAdjustments.live90sHighlightRolloff ?? INITIAL_ADJUSTMENTS.live90sHighlightRolloff,
    live90sDiffusion: loadedAdjustments.live90sDiffusion ?? INITIAL_ADJUSTMENTS.live90sDiffusion,
    live90sDiffusionThreshold: loadedAdjustments.live90sDiffusionThreshold ?? INITIAL_ADJUSTMENTS.live90sDiffusionThreshold,
    live90sStarAmount: loadedAdjustments.live90sStarAmount ?? INITIAL_ADJUSTMENTS.live90sStarAmount,
    live90sStarLength: loadedAdjustments.live90sStarLength ?? INITIAL_ADJUSTMENTS.live90sStarLength,
    live90sStarPoints: loadedAdjustments.live90sStarPoints ?? INITIAL_ADJUSTMENTS.live90sStarPoints,
    live90sStarAngle: loadedAdjustments.live90sStarAngle ?? INITIAL_ADJUSTMENTS.live90sStarAngle,
    live90sWarmth: loadedAdjustments.live90sWarmth ?? INITIAL_ADJUSTMENTS.live90sWarmth,
    live90sVideoNoise: loadedAdjustments.live90sVideoNoise ?? INITIAL_ADJUSTMENTS.live90sVideoNoise,
    live90sInterlace: loadedAdjustments.live90sInterlace ?? INITIAL_ADJUSTMENTS.live90sInterlace,
    live90sInterlaceStrength: loadedAdjustments.live90sInterlaceStrength ?? INITIAL_ADJUSTMENTS.live90sInterlaceStrength,
    live90sSdLook: loadedAdjustments.live90sSdLook ?? INITIAL_ADJUSTMENTS.live90sSdLook,
    live90sPreset: loadedAdjustments.live90sPreset ?? INITIAL_ADJUSTMENTS.live90sPreset,
    live90sSeed: loadedAdjustments.live90sSeed ?? INITIAL_ADJUSTMENTS.live90sSeed,`,
  },

  // ---- TS: register the section tool --------------------------------
  {
    file: 'src/utils/adjustments.ts',
    id: 'ts-register-effects-tools',
    anchor:
      "    { id: 'grain', label: 'adjustments.effects.grain' },\n" +
      '  ],\n' +
      '};',
    mode: 'replace',
    alreadyApplied: "{ id: 'live90s', label: 'editor.live90s.title' }",
    payload:
      "    { id: 'grain', label: 'adjustments.effects.grain' },\n" +
      "    { id: 'live90s', label: 'editor.live90s.title' },\n" +
      '  ],\n' +
      '};',
  },

  // ---- TS: copy/paste group -----------------------------------------
  {
    file: 'src/utils/adjustments.ts',
    id: 'ts-register-copy-groups',
    anchor:
      "    { label: 'modals.copyPaste.groups.grain', keys: [Effect.GrainAmount, Effect.GrainRoughness, Effect.GrainSize] },",
    mode: 'insertAfter',
    alreadyApplied: "'modals.copyPaste.groups.live90s'",
    payload: `
    {
      label: 'modals.copyPaste.groups.live90s',
      keys: [
        Effect.Live90sEnabled,
        Effect.Live90sAmount,
        Effect.Live90sSoftness,
        Effect.Live90sDetail,
        Effect.Live90sChromaBleed,
        Effect.Live90sColorPunch,
        Effect.Live90sBlackLift,
        Effect.Live90sHighlightRolloff,
        Effect.Live90sDiffusion,
        Effect.Live90sDiffusionThreshold,
        Effect.Live90sStarAmount,
        Effect.Live90sStarLength,
        Effect.Live90sStarPoints,
        Effect.Live90sStarAngle,
        Effect.Live90sWarmth,
        Effect.Live90sVideoNoise,
        Effect.Live90sInterlace,
        Effect.Live90sInterlaceStrength,
        Effect.Live90sSdLook,
        Effect.Live90sPreset,
        Effect.Live90sSeed,
      ],
    },`,
  },

  // ---- JSON: default adjustments ------------------------------------
  {
    file: 'src/utils/defaultAdjustments.json',
    id: 'json-default-adjustments',
    anchor: '  "grainSize": 25,',
    mode: 'insertAfter',
    alreadyApplied: '"live90sEnabled"',
    payload: `
  "live90sEnabled": false,
  "live90sAmount": 100,
  "live90sSoftness": 38,
  "live90sDetail": 45,
  "live90sChromaBleed": 48,
  "live90sColorPunch": 55,
  "live90sBlackLift": 18,
  "live90sHighlightRolloff": 52,
  "live90sDiffusion": 58,
  "live90sDiffusionThreshold": 58,
  "live90sStarAmount": 65,
  "live90sStarLength": 68,
  "live90sStarPoints": "4",
  "live90sStarAngle": 0,
  "live90sWarmth": 58,
  "live90sVideoNoise": 5,
  "live90sInterlace": true,
  "live90sInterlaceStrength": 18,
  "live90sSdLook": "pal576",
  "live90sPreset": "musicSpecial",
  "live90sSeed": 1,`,
  },

  // ---- TSX: import the section --------------------------------------
  {
    file: 'src/components/adjustments/Effects.tsx',
    id: 'tsx-effects-import',
    anchor: "import AdjustmentSubSection from './AdjustmentSubSection';",
    mode: 'insertAfter',
    alreadyApplied: "import Live90sSection from './sections/Live90sSection';",
    payload:
      '\n/* live90s-plugin:import */\n' +
      "import Live90sSection from './sections/Live90sSection';",
  },

  // ---- TSX: mount the section after Grain ----------------------------
  {
    file: 'src/components/adjustments/Effects.tsx',
    id: 'tsx-effects-mount',
    anchor:
      '                value={adjustments.grainRoughness}\n' +
      '                onDragStateChange={onDragStateChange}\n' +
      '                fillOrigin="min"\n' +
      '              />\n' +
      '            </AdjustmentSubSection>\n' +
      '          )}\n' +
      '        </>',
    mode: 'replace',
    alreadyApplied: '/* live90s-plugin:section */',
    payload:
      '                value={adjustments.grainRoughness}\n' +
      '                onDragStateChange={onDragStateChange}\n' +
      '                fillOrigin="min"\n' +
      '              />\n' +
      '            </AdjustmentSubSection>\n' +
      '          )}\n' +
      '\n' +
      '          {/* live90s-plugin:section */}\n' +
      '          <Live90sSection\n' +
      '            adjustments={adjustments}\n' +
      '            hiddenTools={hiddenTools}\n' +
      '            onDragStateChange={onDragStateChange}\n' +
      '            setAdjustments={setAdjustments}\n' +
      '            toolOrder={toolOrder}\n' +
      '          />\n' +
      '        </>',
  },
];

// --------------------------------------------------------------------
// i18n deep-merge (editor.live90s.* + copy/paste group label).
// --------------------------------------------------------------------
const EDITOR_EN = {
  _live90sPluginInstalled: PLUGIN_VERSION,
  live90s: {
    title: '1990s TV Live Show', enable: 'Enable', preset: 'Preset', amount: 'Amount',
    softness: 'Camera Softness', detail: 'Aperture / Edge Detail', chromaBleed: 'Chroma Bleed',
    colorPunch: 'Stage Colour Punch', blackLift: 'Black Lift', highlightRolloff: 'Highlight Roll-off',
    diffusion: 'Light Diffusion', diffusionThreshold: 'Light Threshold', starAmount: 'Light Stars',
    starLength: 'Star Length', starPoints: 'Star Points', starPoints4: '4 points',
    starPoints6: '6 points', starPoints8: '8 points', starAngle: 'Star Angle', warmth: 'Stage Warmth',
    videoNoise: 'Video Noise', interlace: 'Interlacing', interlaceStrength: 'Interlace Strength',
    sdLook: 'SD Format', rerollSeed: 'Reroll', rerollSeedTitle: 'Reroll the video-noise seed',
    presets: { musicSpecial: 'Music Special', variety: 'Variety Show', concert: 'Live Concert', cleanBetacam: 'Clean Betacam SP', custom: 'Custom' },
    sd: { off: 'Off', pal576: 'PAL 576', ntsc480: 'NTSC 480' },
  },
};

const EDITOR_DE = {
  _live90sPluginInstalled: PLUGIN_VERSION,
  live90s: {
    title: '1990s TV Live Show', enable: 'Aktivieren', preset: 'Vorlage', amount: 'Stärke',
    softness: 'Kamera-Weichheit', detail: 'Apertur-/Konturschärfe', chromaBleed: 'Farbsaum / Chroma Bleed',
    colorPunch: 'Bühnen-Farbkraft', blackLift: 'Schwarz-Anhebung', highlightRolloff: 'Lichter-Kompression',
    diffusion: 'Licht-Diffusion', diffusionThreshold: 'Licht-Schwelle', starAmount: 'Lichtsterne',
    starLength: 'Stern-Länge', starPoints: 'Stern-Strahlen', starPoints4: '4 Strahlen',
    starPoints6: '6 Strahlen', starPoints8: '8 Strahlen', starAngle: 'Stern-Winkel', warmth: 'Bühnen-Wärme',
    videoNoise: 'Videorauschen', interlace: 'Interlacing', interlaceStrength: 'Interlace-Stärke',
    sdLook: 'SD-Format', rerollSeed: 'Neu', rerollSeedTitle: 'Videorausch-Seed neu würfeln',
    presets: { musicSpecial: 'Musik-Special', variety: 'Unterhaltungsshow', concert: 'Live-Konzert', cleanBetacam: 'Sauberes Betacam SP', custom: 'Benutzerdefiniert' },
    sd: { off: 'Aus', pal576: 'PAL 576', ntsc480: 'NTSC 480' },
  },
};

const MODALS_GROUP = { copyPaste: { groups: { live90s: '1990s TV Live Show' } } };

export const I18N_PATCHES = {
  en: {
    path: 'src/i18n/locales/en.json',
    editor: EDITOR_EN,
    modals: MODALS_GROUP,
  },
  de: {
    path: 'src/i18n/locales/de.json',
    editor: EDITOR_DE,
    modals: MODALS_GROUP,
  },
};
