'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Palette, Leaf, Waves, Sun, Moon, Zap } from 'lucide-react';
import type { ThemePreset, CustomizationConfig } from '@kairn/config';
import { DEFAULT_PRESETS } from '@kairn/config';

interface PresetGalleryProps {
  value: ThemePreset;
  onChange: (preset: ThemePreset, config: Partial<CustomizationConfig>) => void;
}

const PRESET_INFO: Record<ThemePreset, { label: string; description: string; icon: typeof Sparkles }> = {
  minimal: {
    label: 'Minimaliste',
    description: 'Epure et elegant, avec beaucoup d\'espace blanc',
    icon: Moon,
  },
  elegant: {
    label: 'Elegant',
    description: 'Sophistique avec des touches dorees',
    icon: Sparkles,
  },
  bold: {
    label: 'Audacieux',
    description: 'Couleurs vives et contrastes forts',
    icon: Zap,
  },
  nature: {
    label: 'Nature',
    description: 'Tons naturels, verts et terreux',
    icon: Leaf,
  },
  ocean: {
    label: 'Ocean',
    description: 'Teintes marines et apaisantes',
    icon: Waves,
  },
  sunset: {
    label: 'Crepuscule',
    description: 'Oranges, roses et violets chauds',
    icon: Sun,
  },
  monochrome: {
    label: 'Monochrome',
    description: 'Nuances de gris professionnelles',
    icon: Moon,
  },
  custom: {
    label: 'Personnalise',
    description: 'Creez votre propre theme unique',
    icon: Palette,
  },
};

export function PresetGallery({ value, onChange }: PresetGalleryProps) {
  const presets = Object.keys(DEFAULT_PRESETS) as ThemePreset[];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-ivory mb-1">Prereglages de theme</h3>
        <p className="text-xs text-ivory/50">
          Choisissez un prereglage comme point de depart ou creez votre propre theme
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {presets.map((preset, index) => {
          const info = PRESET_INFO[preset];
          const presetConfig = DEFAULT_PRESETS[preset];
          const Icon = info.icon;
          const isSelected = value === preset;
          const colors = presetConfig.colors ?? {
            primary: '#C7A962',
            secondary: '#0E1F2F',
            accent: '#E5C78E',
            background: '#FFFFFF',
            foreground: '#1A1A1A',
          };

          return (
            <motion.button
              key={preset}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChange(preset, presetConfig)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10'
                  : 'border-ivory/10 hover:border-ivory/30 hover:bg-ivory/5'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  layoutId="presetSelected"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-gold flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-night" />
                </motion.div>
              )}

              {/* Color preview */}
              <div className="flex gap-1 mb-3">
                <div
                  className="h-8 w-8 rounded-lg shadow-inner"
                  style={{ backgroundColor: colors.primary }}
                  title="Primaire"
                />
                <div
                  className="h-8 w-8 rounded-lg shadow-inner"
                  style={{ backgroundColor: colors.secondary }}
                  title="Secondaire"
                />
                <div
                  className="h-8 w-8 rounded-lg shadow-inner"
                  style={{ backgroundColor: colors.accent }}
                  title="Accent"
                />
              </div>

              {/* Mini preview */}
              <div
                className="h-16 rounded-xl mb-3 overflow-hidden relative"
                style={{ backgroundColor: colors.background }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-4"
                  style={{ backgroundColor: colors.secondary }}
                />
                <div className="absolute inset-4 top-6 space-y-1.5">
                  <div
                    className="h-2 w-3/4 rounded"
                    style={{ backgroundColor: colors.foreground, opacity: 0.8 }}
                  />
                  <div
                    className="h-1.5 w-full rounded"
                    style={{ backgroundColor: colors.foreground, opacity: 0.3 }}
                  />
                  <div
                    className="h-1.5 w-2/3 rounded"
                    style={{ backgroundColor: colors.foreground, opacity: 0.3 }}
                  />
                </div>
                <div
                  className="absolute bottom-2 right-2 h-4 w-8 rounded"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>

              {/* Info */}
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-gold/20 text-gold' : 'bg-ivory/10 text-ivory/60'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${isSelected ? 'text-ivory' : 'text-ivory/80'}`}>
                    {info.label}
                  </div>
                  <div className="text-xs text-ivory/50 line-clamp-2">
                    {info.description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default PresetGallery;
