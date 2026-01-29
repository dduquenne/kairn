'use client';

import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { CustomizationConfig } from '@kairn/config';

interface LivePreviewProps {
  config: CustomizationConfig;
  siteUrl?: string;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export function LivePreview({ config, siteUrl }: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { colors, typography, effects } = config;

  const viewModes: { id: ViewMode; icon: typeof Monitor; label: string; width: string }[] = [
    { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
    { id: 'tablet', icon: Tablet, label: 'Tablette', width: '768px' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getContainerWidth = () => {
    switch (viewMode) {
      case 'tablet': return 'max-w-[768px]';
      case 'mobile': return 'max-w-[375px]';
      default: return 'max-w-full';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-night/80 border-b border-ivory/10">
        <div className="flex items-center gap-1 p-1 bg-night/60 rounded-lg">
          {viewModes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                viewMode === id
                  ? 'bg-gold/20 text-gold'
                  : 'text-ivory/60 hover:text-ivory hover:bg-ivory/10'
              }`}
              title={label}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-lg text-ivory/60 hover:text-ivory hover:bg-ivory/10 transition-all"
            title="Rafraichir"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-ivory/60 hover:text-ivory hover:bg-ivory/10 transition-all"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview container */}
      <div className="flex-1 p-4 bg-[#1a1a2e] overflow-auto">
        <motion.div
          layout
          className={`mx-auto ${getContainerWidth()} transition-all duration-300`}
        >
          {/* Simulated browser chrome */}
          <div className="rounded-t-xl bg-[#2a2a3e] border border-ivory/10 border-b-0 p-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-2">
                <div className="h-6 rounded bg-night/50 flex items-center px-3">
                  <span className="text-xs text-ivory/40 truncate">{siteUrl || 'https://votre-site.fr'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview content */}
          <motion.div
            key={isRefreshing ? 'refreshing' : 'preview'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-b-xl overflow-hidden border border-ivory/10 border-t-0"
            style={{
              backgroundColor: colors.background,
              fontFamily: `'${typography.fontBody}', sans-serif`,
              fontSize: `${typography.baseFontSize}px`,
              lineHeight: typography.lineHeight,
            }}
          >
            {/* Header */}
            <header
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: colors.secondary }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                />
                <span
                  className="font-semibold"
                  style={{
                    color: colors.background,
                    fontFamily: `'${typography.fontDisplay}', serif`,
                  }}
                >
                  Votre Site
                </span>
              </div>
              <nav className="hidden sm:flex items-center gap-4 text-sm">
                {['Accueil', 'Services', 'Contact'].map((item) => (
                  <span
                    key={item}
                    style={{ color: colors.background, opacity: 0.8 }}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    {item}
                  </span>
                ))}
              </nav>
            </header>

            {/* Hero section */}
            <section
              className="px-6 py-12 text-center"
              style={{
                background: effects.enableGradients
                  ? `linear-gradient(135deg, ${colors.secondary}15 0%, transparent 50%)`
                  : 'transparent',
              }}
            >
              <h1
                className="text-3xl sm:text-4xl font-bold mb-4"
                style={{
                  color: colors.foreground,
                  fontFamily: `'${typography.fontDisplay}', serif`,
                  lineHeight: typography.headingLineHeight,
                }}
              >
                Bienvenue sur notre site
              </h1>
              <p
                className="max-w-lg mx-auto mb-6"
                style={{
                  color: colors.foregroundMuted || `${colors.foreground}99`,
                }}
              >
                Decouvrez nos services et laissez-nous vous accompagner dans votre projet.
              </p>
              <button
                className="px-6 py-3 rounded-lg font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                  borderRadius: config.layout.borderRadius === 'none' ? '0' :
                    config.layout.borderRadius === 'small' ? '0.25rem' :
                    config.layout.borderRadius === 'large' ? '1rem' :
                    config.layout.borderRadius === 'full' ? '9999px' : '0.5rem',
                  boxShadow: effects.enableShadows
                    ? `0 4px 14px ${colors.primary}40`
                    : 'none',
                }}
              >
                Decouvrir
              </button>
            </section>

            {/* Features section */}
            <section className="px-6 py-8">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: 'Expertise', color: colors.success },
                  { title: 'Qualite', color: colors.info },
                  { title: 'Support', color: colors.warning },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: `${feature.color}15`,
                      borderRadius: config.layout.borderRadius === 'none' ? '0' :
                        config.layout.borderRadius === 'small' ? '0.25rem' :
                        config.layout.borderRadius === 'large' ? '1rem' :
                        config.layout.borderRadius === 'full' ? '1.5rem' : '0.5rem',
                    }}
                  >
                    <div
                      className="h-6 w-6 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: feature.color }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: colors.foreground }}
                    >
                      {feature.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <footer
              className="px-6 py-4 text-center text-xs"
              style={{
                backgroundColor: colors.secondary,
                color: `${colors.background}80`,
              }}
            >
              2024 Votre Site - Tous droits reserves
            </footer>
          </motion.div>
        </motion.div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-night/60 border-t border-ivory/10 text-xs text-ivory/50">
        <div className="flex items-center gap-4">
          <span>
            Police: <span className="text-ivory/70">{typography.fontDisplay}</span>
          </span>
          <span>
            Taille: <span className="text-ivory/70">{typography.baseFontSize}px</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {[colors.primary, colors.secondary, colors.accent].map((color, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-full border border-ivory/20"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default LivePreview;
