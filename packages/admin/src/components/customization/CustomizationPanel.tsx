'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  Settings2,
  Wand2,
} from 'lucide-react';
import type { CustomizationConfig, ThemePreset } from '@kairn/config';
import { mergePresetWithOverrides } from '@kairn/config';

import { ColorPicker } from './ColorPicker';
import { FontSelector } from './FontSelector';
import { PresetGallery } from './PresetGallery';
import { LivePreview } from './LivePreview';

interface CustomizationPanelProps {
  initialConfig?: Partial<CustomizationConfig>;
  onSave: (config: CustomizationConfig) => Promise<void>;
  onReset?: () => void;
  siteUrl?: string;
}

type Tab = 'presets' | 'colors' | 'typography' | 'layout' | 'effects';

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: 'presets', label: 'Prereglages', icon: Wand2 },
  { id: 'colors', label: 'Couleurs', icon: Palette },
  { id: 'typography', label: 'Typographie', icon: Type },
  { id: 'layout', label: 'Mise en page', icon: Layout },
  { id: 'effects', label: 'Effets', icon: Sparkles },
];

const DEFAULT_CONFIG: CustomizationConfig = mergePresetWithOverrides('elegant');

export function CustomizationPanel({
  initialConfig,
  onSave,
  onReset,
  siteUrl,
}: CustomizationPanelProps) {
  const [config, setConfig] = useState<CustomizationConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig,
    colors: { ...DEFAULT_CONFIG.colors, ...initialConfig?.colors },
    typography: { ...DEFAULT_CONFIG.typography, ...initialConfig?.typography },
    layout: { ...DEFAULT_CONFIG.layout, ...initialConfig?.layout },
    effects: { ...DEFAULT_CONFIG.effects, ...initialConfig?.effects },
    darkMode: { ...DEFAULT_CONFIG.darkMode, ...initialConfig?.darkMode },
  }));
  const [activeTab, setActiveTab] = useState<Tab>('presets');
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(initialConfig || DEFAULT_CONFIG));
  }, [config, initialConfig]);

  const updateColors = useCallback((key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  }, []);

  const updateTypography = useCallback((key: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  }, []);

  const updateLayout = useCallback((key: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: value },
    }));
  }, []);

  const updateEffects = useCallback((key: string, value: boolean | string) => {
    setConfig(prev => ({
      ...prev,
      effects: { ...prev.effects, [key]: value },
    }));
  }, []);

  const handlePresetChange = useCallback((preset: ThemePreset, presetConfig: Partial<CustomizationConfig>) => {
    const newConfig = mergePresetWithOverrides(preset, presetConfig);
    setConfig(newConfig);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onSave(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setConfig(initialConfig ? { ...DEFAULT_CONFIG, ...initialConfig } : DEFAULT_CONFIG);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] gap-4">
      {/* Left panel - Configuration */}
      <div className={`flex flex-col ${showPreview ? 'lg:w-1/2' : 'w-full'} bg-night/40 rounded-2xl border border-ivory/10 overflow-hidden transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-ivory/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h2 className="font-semibold text-ivory">Personnalisation</h2>
              <p className="text-xs text-ivory/50">Configurez l'apparence de votre site</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ivory/60 hover:text-ivory hover:bg-ivory/10 transition-all"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Masquer' : 'Afficher'} l'apercu
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-ivory/10 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-gold/20 text-gold'
                  : 'text-ivory/60 hover:text-ivory hover:bg-ivory/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {activeTab === 'presets' && (
                <PresetGallery
                  value={config.preset}
                  onChange={handlePresetChange}
                />
              )}

              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <ColorPicker
                      label="Couleur principale"
                      description="Utilise pour les boutons et elements importants"
                      value={config.colors.primary}
                      onChange={(v) => updateColors('primary', v)}
                    />
                    <ColorPicker
                      label="Couleur secondaire"
                      description="Utilise pour les en-tetes et pieds de page"
                      value={config.colors.secondary}
                      onChange={(v) => updateColors('secondary', v)}
                    />
                    <ColorPicker
                      label="Couleur d'accent"
                      description="Pour mettre en valeur certains elements"
                      value={config.colors.accent}
                      onChange={(v) => updateColors('accent', v)}
                    />
                    <ColorPicker
                      label="Arriere-plan"
                      description="Couleur de fond principale du site"
                      value={config.colors.background}
                      onChange={(v) => updateColors('background', v)}
                    />
                    <ColorPicker
                      label="Texte principal"
                      description="Couleur du texte principal"
                      value={config.colors.foreground}
                      onChange={(v) => updateColors('foreground', v)}
                    />
                  </div>

                  <div className="pt-4 border-t border-ivory/10">
                    <h4 className="text-sm font-medium text-ivory mb-4">Couleurs de feedback</h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <ColorPicker
                        label="Succes"
                        value={config.colors.success}
                        onChange={(v) => updateColors('success', v)}
                        showCopyButton={false}
                      />
                      <ColorPicker
                        label="Avertissement"
                        value={config.colors.warning}
                        onChange={(v) => updateColors('warning', v)}
                        showCopyButton={false}
                      />
                      <ColorPicker
                        label="Erreur"
                        value={config.colors.error}
                        onChange={(v) => updateColors('error', v)}
                        showCopyButton={false}
                      />
                      <ColorPicker
                        label="Information"
                        value={config.colors.info}
                        onChange={(v) => updateColors('info', v)}
                        showCopyButton={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <FontSelector
                    label="Police des titres"
                    description="Utilise pour les titres et en-tetes"
                    value={config.typography.fontDisplay}
                    onChange={(v) => updateTypography('fontDisplay', v)}
                    category="display"
                    previewText="Titre de votre site"
                  />

                  <FontSelector
                    label="Police du corps de texte"
                    description="Utilise pour les paragraphes et textes"
                    value={config.typography.fontBody}
                    onChange={(v) => updateTypography('fontBody', v)}
                    category="body"
                    previewText="Corps de texte exemple"
                  />

                  <FontSelector
                    label="Police monospace"
                    description="Utilise pour le code et donnees techniques"
                    value={config.typography.fontMono}
                    onChange={(v) => updateTypography('fontMono', v)}
                    category="mono"
                    previewText="const code = 'exemple';"
                  />

                  <div className="pt-4 border-t border-ivory/10">
                    <h4 className="text-sm font-medium text-ivory mb-4">Parametres typographiques</h4>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-ivory mb-2">
                          Taille de base: {config.typography.baseFontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="20"
                          value={config.typography.baseFontSize}
                          onChange={(e) => updateTypography('baseFontSize', parseInt(e.target.value))}
                          className="w-full h-2 bg-night/60 rounded-lg appearance-none cursor-pointer accent-gold"
                        />
                        <div className="flex justify-between text-xs text-ivory/40 mt-1">
                          <span>12px</span>
                          <span>20px</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ivory mb-2">
                          Hauteur de ligne: {config.typography.lineHeight}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={config.typography.lineHeight}
                          onChange={(e) => updateTypography('lineHeight', parseFloat(e.target.value))}
                          className="w-full h-2 bg-night/60 rounded-lg appearance-none cursor-pointer accent-gold"
                        />
                        <div className="flex justify-between text-xs text-ivory/40 mt-1">
                          <span>Compact</span>
                          <span>Aere</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ivory mb-2">
                          Espacement des lettres
                        </label>
                        <div className="flex gap-2">
                          {(['tight', 'normal', 'wide'] as const).map((spacing) => (
                            <button
                              key={spacing}
                              type="button"
                              onClick={() => updateTypography('letterSpacing', spacing)}
                              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                config.typography.letterSpacing === spacing
                                  ? 'bg-gold/20 text-gold border border-gold/30'
                                  : 'bg-night/40 text-ivory/60 border border-ivory/10 hover:border-ivory/30'
                              }`}
                            >
                              {spacing === 'tight' ? 'Serre' : spacing === 'normal' ? 'Normal' : 'Large'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ivory mb-2">
                          Graisse des titres
                        </label>
                        <div className="flex gap-2">
                          {(['normal', 'medium', 'semibold', 'bold'] as const).map((weight) => (
                            <button
                              key={weight}
                              type="button"
                              onClick={() => updateTypography('headingWeight', weight)}
                              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                config.typography.headingWeight === weight
                                  ? 'bg-gold/20 text-gold border border-gold/30'
                                  : 'bg-night/40 text-ivory/60 border border-ivory/10 hover:border-ivory/30'
                              }`}
                            >
                              {weight === 'normal' ? 'Normal' : weight === 'medium' ? 'Medium' : weight === 'semibold' ? 'Semi' : 'Gras'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Rayon des bordures
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['none', 'small', 'medium', 'large', 'full'] as const).map((radius) => (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => updateLayout('borderRadius', radius)}
                          className={`group flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                            config.layout.borderRadius === radius
                              ? 'bg-gold/20 border-2 border-gold'
                              : 'bg-night/40 border-2 border-transparent hover:border-ivory/20'
                          }`}
                        >
                          <div
                            className={`h-8 w-8 bg-ivory/20 ${
                              config.layout.borderRadius === radius ? 'bg-gold/40' : ''
                            }`}
                            style={{
                              borderRadius: radius === 'none' ? '0' :
                                radius === 'small' ? '4px' :
                                radius === 'medium' ? '8px' :
                                radius === 'large' ? '16px' : '9999px',
                            }}
                          />
                          <span className={`text-xs ${config.layout.borderRadius === radius ? 'text-gold' : 'text-ivory/60'}`}>
                            {radius === 'none' ? 'Aucun' :
                             radius === 'small' ? 'Petit' :
                             radius === 'medium' ? 'Moyen' :
                             radius === 'large' ? 'Grand' : 'Complet'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Espacement general
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['compact', 'comfortable', 'spacious'] as const).map((spacing) => (
                        <button
                          key={spacing}
                          type="button"
                          onClick={() => updateLayout('spacing', spacing)}
                          className={`group flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                            config.layout.spacing === spacing
                              ? 'bg-gold/20 border-2 border-gold'
                              : 'bg-night/40 border-2 border-transparent hover:border-ivory/20'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 bg-ivory/20 rounded ${config.layout.spacing === spacing ? 'bg-gold/40' : ''}`}
                                style={{
                                  width: `${24 + i * 8}px`,
                                  marginBottom: spacing === 'compact' ? '2px' : spacing === 'comfortable' ? '4px' : '6px',
                                }}
                              />
                            ))}
                          </div>
                          <span className={`text-xs ${config.layout.spacing === spacing ? 'text-gold' : 'text-ivory/60'}`}>
                            {spacing === 'compact' ? 'Compact' : spacing === 'comfortable' ? 'Confortable' : 'Spacieux'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ivory mb-2">
                      Largeur maximale du contenu: {config.layout.maxContentWidth}px
                    </label>
                    <input
                      type="range"
                      min="800"
                      max="1600"
                      step="80"
                      value={config.layout.maxContentWidth}
                      onChange={(e) => updateLayout('maxContentWidth', parseInt(e.target.value))}
                      className="w-full h-2 bg-night/60 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                    <div className="flex justify-between text-xs text-ivory/40 mt-1">
                      <span>Etroit (800px)</span>
                      <span>Large (1600px)</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-ivory mb-2">
                        Style de l'en-tete
                      </label>
                      <div className="flex flex-col gap-2">
                        {(['transparent', 'solid', 'gradient'] as const).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => updateLayout('headerStyle', style)}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              config.layout.headerStyle === style
                                ? 'bg-gold/20 border border-gold/30 text-gold'
                                : 'bg-night/40 border border-ivory/10 text-ivory/60 hover:border-ivory/30'
                            }`}
                          >
                            <div
                              className="h-6 w-full rounded"
                              style={{
                                background: style === 'transparent' ? 'transparent' :
                                  style === 'solid' ? config.colors.secondary :
                                  `linear-gradient(90deg, ${config.colors.secondary}, ${config.colors.primary})`,
                                border: style === 'transparent' ? '1px dashed currentColor' : 'none',
                              }}
                            />
                            <span className="text-sm whitespace-nowrap">
                              {style === 'transparent' ? 'Transparent' : style === 'solid' ? 'Solide' : 'Degrade'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ivory mb-2">
                        Position de l'en-tete
                      </label>
                      <div className="flex flex-col gap-2">
                        {(['fixed', 'sticky', 'static'] as const).map((position) => (
                          <button
                            key={position}
                            type="button"
                            onClick={() => updateLayout('headerPosition', position)}
                            className={`p-3 rounded-lg text-sm text-left transition-all ${
                              config.layout.headerPosition === position
                                ? 'bg-gold/20 border border-gold/30 text-gold'
                                : 'bg-night/40 border border-ivory/10 text-ivory/60 hover:border-ivory/30'
                            }`}
                          >
                            {position === 'fixed' ? 'Fixe (toujours visible)' :
                             position === 'sticky' ? 'Collant (suit le scroll)' : 'Statique (defilement)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'effects' && (
                <div className="space-y-6">
                  {/* Toggle switches */}
                  <div className="space-y-3">
                    {[
                      { key: 'enableAnimations', label: 'Animations', description: 'Transitions et animations fluides' },
                      { key: 'enableShadows', label: 'Ombres', description: 'Ombres portees sur les elements' },
                      { key: 'enableGradients', label: 'Degrades', description: 'Arriere-plans en degrade' },
                      { key: 'enableBlur', label: 'Effets de flou', description: 'Flou d\'arriere-plan (glassmorphism)' },
                      { key: 'enableParallax', label: 'Parallax', description: 'Effet de profondeur au scroll' },
                    ].map(({ key, label, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-night/40 border border-ivory/10"
                      >
                        <div>
                          <div className="font-medium text-ivory">{label}</div>
                          <div className="text-xs text-ivory/50">{description}</div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={config.effects[key as keyof typeof config.effects] as boolean}
                          onClick={() => updateEffects(key, !config.effects[key as keyof typeof config.effects])}
                          className={`relative h-7 w-12 rounded-full transition-colors ${
                            config.effects[key as keyof typeof config.effects]
                              ? 'bg-gold'
                              : 'bg-ivory/20'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              config.effects[key as keyof typeof config.effects]
                                ? 'left-6'
                                : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Animation speed */}
                  {config.effects.enableAnimations && (
                    <div>
                      <label className="block text-sm font-medium text-ivory mb-2">
                        Vitesse des animations
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['slow', 'normal', 'fast'] as const).map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => updateEffects('animationSpeed', speed)}
                            className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                              config.effects.animationSpeed === speed
                                ? 'bg-gold/20 text-gold border border-gold/30'
                                : 'bg-night/40 text-ivory/60 border border-ivory/10 hover:border-ivory/30'
                            }`}
                          >
                            {speed === 'slow' ? 'Lente' : speed === 'normal' ? 'Normale' : 'Rapide'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shadow intensity */}
                  {config.effects.enableShadows && (
                    <div>
                      <label className="block text-sm font-medium text-ivory mb-2">
                        Intensite des ombres
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['subtle', 'medium', 'strong'] as const).map((intensity) => (
                          <button
                            key={intensity}
                            type="button"
                            onClick={() => updateEffects('shadowIntensity', intensity)}
                            className={`group flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                              config.effects.shadowIntensity === intensity
                                ? 'bg-gold/20 border border-gold/30'
                                : 'bg-night/40 border border-ivory/10 hover:border-ivory/30'
                            }`}
                          >
                            <div
                              className="h-8 w-8 rounded-lg bg-ivory/80"
                              style={{
                                boxShadow: intensity === 'subtle' ? '0 2px 4px rgba(0,0,0,0.1)' :
                                  intensity === 'medium' ? '0 4px 8px rgba(0,0,0,0.2)' :
                                  '0 8px 16px rgba(0,0,0,0.3)',
                              }}
                            />
                            <span className={`text-xs ${config.effects.shadowIntensity === intensity ? 'text-gold' : 'text-ivory/60'}`}>
                              {intensity === 'subtle' ? 'Subtile' : intensity === 'medium' ? 'Moyenne' : 'Forte'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-ivory/10 bg-night/60">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-ivory/60 hover:text-ivory hover:bg-ivory/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            Reinitialiser
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              saveStatus === 'success'
                ? 'bg-green-500 text-white'
                : saveStatus === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-gold text-night hover:bg-gold/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-night/30 border-t-night rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <Check className="h-4 w-4" />
                Enregistre
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Erreur
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right panel - Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden lg:flex lg:w-1/2 flex-col bg-night/40 rounded-2xl border border-ivory/10 overflow-hidden"
          >
            <LivePreview config={config} siteUrl={siteUrl} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomizationPanel;
