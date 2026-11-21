// 1990s Television Live Show — frontend presets and field types.
import type { Adjustments } from './adjustments';

export type Live90sSdLook = 'off' | 'pal576' | 'ntsc480';
export type Live90sStarPoints = '4' | '6' | '8';
export type Live90sPreset = 'musicSpecial' | 'variety' | 'concert' | 'cleanBetacam' | 'custom';

type Live90sPresetValues = Pick<
  Adjustments,
  | 'live90sPreset'
  | 'live90sAmount'
  | 'live90sSoftness'
  | 'live90sDetail'
  | 'live90sChromaBleed'
  | 'live90sColorPunch'
  | 'live90sBlackLift'
  | 'live90sHighlightRolloff'
  | 'live90sDiffusion'
  | 'live90sDiffusionThreshold'
  | 'live90sStarAmount'
  | 'live90sStarLength'
  | 'live90sStarPoints'
  | 'live90sStarAngle'
  | 'live90sWarmth'
  | 'live90sVideoNoise'
  | 'live90sInterlace'
  | 'live90sInterlaceStrength'
  | 'live90sSdLook'
>;

export const LIVE90S_PRESETS: Array<{ id: Live90sPreset; values: Live90sPresetValues }> = [
  {
    // Signature European music-special look: PAL softness, warm diffusion and
    // long eight-point cross-screen rays from stage lamps.
    id: 'musicSpecial',
    values: {
      live90sPreset: 'musicSpecial',
      live90sAmount: 100,
      live90sSoftness: 38,
      live90sDetail: 45,
      live90sChromaBleed: 48,
      live90sColorPunch: 55,
      live90sBlackLift: 18,
      live90sHighlightRolloff: 52,
      live90sDiffusion: 58,
      live90sDiffusionThreshold: 58,
      live90sStarAmount: 65,
      live90sStarLength: 68,
      live90sStarPoints: '8',
      live90sStarAngle: 0,
      live90sWarmth: 58,
      live90sVideoNoise: 5,
      live90sInterlace: true,
      live90sInterlaceStrength: 18,
      live90sSdLook: 'pal576',
    },
  },
  {
    // Softer family/variety studio lighting with classic four-point stars.
    id: 'variety',
    values: {
      live90sPreset: 'variety',
      live90sAmount: 100,
      live90sSoftness: 48,
      live90sDetail: 34,
      live90sChromaBleed: 52,
      live90sColorPunch: 48,
      live90sBlackLift: 24,
      live90sHighlightRolloff: 60,
      live90sDiffusion: 70,
      live90sDiffusionThreshold: 52,
      live90sStarAmount: 48,
      live90sStarLength: 54,
      live90sStarPoints: '4',
      live90sStarAngle: 45,
      live90sWarmth: 68,
      live90sVideoNoise: 3,
      live90sInterlace: false,
      live90sInterlaceStrength: 18,
      live90sSdLook: 'pal576',
    },
  },
  {
    // Dark stage, saturated gels and pronounced star-filter rays.
    id: 'concert',
    values: {
      live90sPreset: 'concert',
      live90sAmount: 100,
      live90sSoftness: 30,
      live90sDetail: 52,
      live90sChromaBleed: 42,
      live90sColorPunch: 72,
      live90sBlackLift: 8,
      live90sHighlightRolloff: 45,
      live90sDiffusion: 52,
      live90sDiffusionThreshold: 64,
      live90sStarAmount: 82,
      live90sStarLength: 86,
      live90sStarPoints: '8',
      live90sStarAngle: 0,
      live90sWarmth: 48,
      live90sVideoNoise: 8,
      live90sInterlace: true,
      live90sInterlaceStrength: 22,
      live90sSdLook: 'pal576',
    },
  },
  {
    // Clean component-broadcast base without an optical star filter.
    id: 'cleanBetacam',
    values: {
      live90sPreset: 'cleanBetacam',
      live90sAmount: 100,
      live90sSoftness: 26,
      live90sDetail: 62,
      live90sChromaBleed: 36,
      live90sColorPunch: 42,
      live90sBlackLift: 10,
      live90sHighlightRolloff: 48,
      live90sDiffusion: 24,
      live90sDiffusionThreshold: 72,
      live90sStarAmount: 0,
      live90sStarLength: 50,
      live90sStarPoints: '4',
      live90sStarAngle: 0,
      live90sWarmth: 50,
      live90sVideoNoise: 6,
      live90sInterlace: true,
      live90sInterlaceStrength: 20,
      live90sSdLook: 'pal576',
    },
  },
];

export function rollLive90sSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}
