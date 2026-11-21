import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PLUGIN_VERSION,
  BACKUP_DIR,
  MANIFEST_FILE,
  COPY_FILES,
  TEXT_PATCHES,
  I18N_PATCHES,
} from '../installer/patches.mjs';
import { LIVE90S_PRESETS, rollLive90sSeed } from '../plugin-src/src/utils/live90s.ts';

test('plugin metadata is well formed', () => {
  assert.match(PLUGIN_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(BACKUP_DIR, '.live90s-plugin-backup');
  assert.equal(MANIFEST_FILE, '.live90s-plugin-manifest.json');
});

test('COPY_FILES point at the four new plugin files', () => {
  const targets = COPY_FILES.map((file) => file.to).sort();
  assert.deepEqual(targets, [
    'src-tauri/src/effects/live90s.rs',
    'src-tauri/src/shaders/live90s.wgsl',
    'src/components/adjustments/sections/Live90sSection.tsx',
    'src/utils/live90s.ts',
  ].sort());
});

test('text patches are complete, unique and idempotent', () => {
  const ids = new Set();
  for (const patch of TEXT_PATCHES) {
    assert.ok(patch.file && patch.id && patch.anchor && patch.payload && patch.alreadyApplied);
    assert.ok(['insertAfter', 'insertBefore', 'replace'].includes(patch.mode));
    assert.ok(!ids.has(patch.id), `duplicate id ${patch.id}`);
    assert.ok(patch.payload.includes(patch.alreadyApplied), `${patch.id} keeps marker`);
    ids.add(patch.id);
  }
});

test('renderer registration includes every shader entry point', () => {
  const sourcePatch = TEXT_PATCHES.find((patch) => patch.id === 'rust-group-source');
  for (const entry of ['ls90_bright', 'ls90_star', 'ls90_combine']) {
    assert.ok(sourcePatch.payload.includes(entry), entry);
  }
});

test('i18n covers English and German plus strings and sentinel', () => {
  for (const lang of ['en', 'de']) {
    const entry = I18N_PATCHES[lang];
    assert.equal(entry.editor._live90sPluginInstalled, PLUGIN_VERSION);
    assert.ok(entry.editor.live90s.title);
    assert.ok(entry.editor.live90s.presets.musicSpecial);
    assert.ok(entry.editor.live90s.starPoints8);
    assert.ok(entry.editor.live90s.sd.ntsc480);
    assert.equal(entry.modals.copyPaste.groups.live90s, '1990s TV Live Show');
  }
});

test('presets cover the intended looks and remain in range', () => {
  assert.deepEqual(LIVE90S_PRESETS.map((preset) => preset.id), [
    'musicSpecial', 'variety', 'concert', 'cleanBetacam',
  ]);
  for (const preset of LIVE90S_PRESETS) {
    assert.equal(preset.values.live90sPreset, preset.id);
    assert.ok(['4', '6', '8'].includes(preset.values.live90sStarPoints));
    assert.ok(['off', 'pal576', 'ntsc480'].includes(preset.values.live90sSdLook));
    for (const [key, value] of Object.entries(preset.values)) {
      if (typeof value === 'number') assert.ok(value >= 0 && value <= 100, `${preset.id}.${key}`);
    }
  }
});

test('seed reroll returns a positive integer', () => {
  for (let i = 0; i < 50; i++) {
    const seed = rollLive90sSeed();
    assert.ok(Number.isInteger(seed) && seed > 0 && seed < 2 ** 31);
  }
});
