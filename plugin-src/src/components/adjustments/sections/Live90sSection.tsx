import { useTranslation } from 'react-i18next';
import Slider, { SliderChangeEvent } from '../../ui/Slider';
import Switch from '../../ui/Switch';
import Dropdown from '../../ui/Dropdown';
import AdjustmentSubSection from '../AdjustmentSubSection';
import { SpatialEffect } from '../Effects';
import { Adjustments } from '../../../utils/adjustments';
import {
  LIVE90S_PRESETS,
  Live90sPreset,
  Live90sSdLook,
  Live90sStarPoints,
  rollLive90sSeed,
} from '../../../utils/live90s';

interface Live90sSectionProps {
  adjustments: Adjustments;
  hiddenTools: string[];
  onDragStateChange?: (isDragging: boolean) => void;
  setAdjustments(updater: (prev: Adjustments) => Adjustments): void;
  toolOrder: string[];
}

export default function Live90sSection({
  adjustments,
  hiddenTools,
  onDragStateChange,
  setAdjustments,
  toolOrder,
}: Live90sSectionProps) {
  const { t } = useTranslation();
  const tr = t as unknown as (key: string) => string;

  if (hiddenTools.includes('live90s')) return null;

  const setField = (key: keyof Adjustments, value: number | boolean | string) =>
    setAdjustments((prev) => ({ ...prev, [key]: value, live90sPreset: 'custom' }));

  const applyPreset = (presetId: Live90sPreset) => {
    const preset = LIVE90S_PRESETS.find((entry) => entry.id === presetId);
    if (preset) setAdjustments((prev) => ({ ...prev, ...preset.values }));
  };

  const slider = (
    key: keyof Adjustments,
    labelKey: string,
    defaultValue: number,
    max = 100,
    suffix = ' %',
  ) => (
    <Slider
      defaultValue={defaultValue}
      label={tr(labelKey)}
      max={max}
      min={0}
      onChange={(e: SliderChangeEvent) => setField(key, e.target.value)}
      onDragStateChange={onDragStateChange}
      step={1}
      suffix={suffix}
      value={adjustments[key] as number}
    />
  );

  const presetOptions = [
    { label: t('editor.live90s.presets.musicSpecial'), value: 'musicSpecial' as Live90sPreset },
    { label: t('editor.live90s.presets.variety'), value: 'variety' as Live90sPreset },
    { label: t('editor.live90s.presets.concert'), value: 'concert' as Live90sPreset },
    { label: t('editor.live90s.presets.cleanBetacam'), value: 'cleanBetacam' as Live90sPreset },
    { label: t('editor.live90s.presets.custom'), value: 'custom' as Live90sPreset },
  ];
  const starOptions = [
    { label: t('editor.live90s.starPoints4'), value: '4' as Live90sStarPoints },
    { label: t('editor.live90s.starPoints6'), value: '6' as Live90sStarPoints },
    { label: t('editor.live90s.starPoints8'), value: '8' as Live90sStarPoints },
  ];
  const sdOptions = [
    { label: t('editor.live90s.sd.off'), value: 'off' as Live90sSdLook },
    { label: t('editor.live90s.sd.pal576'), value: 'pal576' as Live90sSdLook },
    { label: t('editor.live90s.sd.ntsc480'), value: 'ntsc480' as Live90sSdLook },
  ];

  return (
    <AdjustmentSubSection
      id="live90s"
      order={toolOrder.indexOf('live90s')}
      title={t('editor.live90s.title')}
      actions={
        <button
          className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-md hover:bg-card-active"
          onClick={() =>
            setAdjustments((prev) => ({ ...prev, live90sSeed: rollLive90sSeed() }))
          }
          title={t('editor.live90s.rerollSeedTitle')}
          type="button"
        >
          {t('editor.live90s.rerollSeed')}
        </button>
      }
    >
      <SpatialEffect
        enabled={adjustments.live90sEnabled}
        label={t('editor.live90s.enable')}
        onToggle={(enabled: boolean) =>
          setAdjustments((prev) => ({ ...prev, live90sEnabled: enabled }))
        }
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-text-secondary">{t('editor.live90s.preset')}</span>
          <Dropdown
            className="w-40"
            onChange={(value: Live90sPreset) => applyPreset(value)}
            options={presetOptions}
            value={adjustments.live90sPreset}
          />
        </div>

        {slider('live90sAmount', 'editor.live90s.amount', 100)}
        {slider('live90sSoftness', 'editor.live90s.softness', 38)}
        {slider('live90sDetail', 'editor.live90s.detail', 45)}
        {slider('live90sChromaBleed', 'editor.live90s.chromaBleed', 48)}
        {slider('live90sColorPunch', 'editor.live90s.colorPunch', 55)}
        {slider('live90sBlackLift', 'editor.live90s.blackLift', 18)}
        {slider('live90sHighlightRolloff', 'editor.live90s.highlightRolloff', 52)}
        {slider('live90sDiffusion', 'editor.live90s.diffusion', 58)}
        {slider('live90sDiffusionThreshold', 'editor.live90s.diffusionThreshold', 58)}
        {slider('live90sStarAmount', 'editor.live90s.starAmount', 65)}
        {slider('live90sStarLength', 'editor.live90s.starLength', 68)}

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-text-secondary">{t('editor.live90s.starPoints')}</span>
          <Dropdown
            className="w-32"
            onChange={(value: Live90sStarPoints) => setField('live90sStarPoints', value)}
            options={starOptions}
            value={adjustments.live90sStarPoints}
          />
        </div>
        {slider('live90sStarAngle', 'editor.live90s.starAngle', 0, 90, '°')}
        {slider('live90sWarmth', 'editor.live90s.warmth', 58)}
        {slider('live90sVideoNoise', 'editor.live90s.videoNoise', 5)}

        <Switch
          checked={adjustments.live90sInterlace}
          label={t('editor.live90s.interlace')}
          onChange={(checked: boolean) => setField('live90sInterlace', checked)}
        />
        {adjustments.live90sInterlace &&
          slider('live90sInterlaceStrength', 'editor.live90s.interlaceStrength', 18)}

        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-sm text-text-secondary">{t('editor.live90s.sdLook')}</span>
          <Dropdown
            className="w-36"
            onChange={(value: Live90sSdLook) => setField('live90sSdLook', value)}
            options={sdOptions}
            value={adjustments.live90sSdLook}
          />
        </div>
      </SpatialEffect>
    </AdjustmentSubSection>
  );
}
