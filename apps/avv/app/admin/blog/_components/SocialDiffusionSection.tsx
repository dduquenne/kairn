'use client';

import { Share2, Sparkles, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { SocialPlatform } from '@/lib/social/types';

import { SocialPlatformIcon } from '../../social/accounts/_components/SocialPlatformIcon';

interface SocialDiffusionSectionProps {
  blogSlug?: string;
  isNewPost: boolean;
}

const PLATFORMS: Array<{ id: SocialPlatform; name: string }> = [
  { id: 'FACEBOOK', name: 'Facebook' },
  { id: 'LINKEDIN', name: 'LinkedIn' },
  { id: 'INSTAGRAM', name: 'Instagram' },
  { id: 'TWITTER', name: 'Twitter/X' },
  { id: 'THREADS', name: 'Threads' },
];

/**
 * Section de diffusion réseaux sociaux dans la page d'édition d'article.
 * Permet de sélectionner les plateformes cibles et redirige vers le module
 * de génération IA dédié (/admin/social/posts/new).
 */
export function SocialDiffusionSection({ blogSlug, isNewPost }: SocialDiffusionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'FACEBOOK',
    'LINKEDIN',
    'INSTAGRAM',
  ]);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  /**
   * Construit l'URL de redirection vers le module de génération IA
   * avec l'article et les plateformes pré-sélectionnés.
   */
  const buildGenerateUrl = () => {
    const params = new URLSearchParams();
    if (blogSlug) params.set('blogSlug', blogSlug);
    if (selectedPlatforms.length > 0) {
      params.set('platforms', selectedPlatforms.join(','));
    }
    return `/admin/social/posts/new?${params.toString()}`;
  };

  // If new post without slug, show disabled state
  if (isNewPost && !blogSlug) {
    return (
      <div className="border-gold/10 bg-night/30 rounded-xl border p-4">
        <div className="text-ivory/40 flex items-center gap-3">
          <Share2 className="h-5 w-5" />
          <span>Sauvegardez l&apos;article pour activer la diffusion sociale</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-gold/20 from-night/60 to-night/40 overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-gold/5 flex w-full items-center justify-between px-6 py-4 transition"
      >
        <div className="flex items-center gap-3">
          <Share2 className="text-gold h-5 w-5" />
          <span className="text-ivory font-semibold">Diffusion réseaux sociaux</span>
        </div>
        <ChevronDown
          className={`text-gold h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-gold/10 space-y-5 border-t px-6 py-4">
          {/* Platform Selection */}
          <div>
            <p className="text-ivory mb-3 text-sm font-medium">
              Sélectionnez les plateformes cibles
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'bg-gold/20 text-gold ring-gold/30 ring-1'
                        : 'bg-night/60 text-ivory/60 hover:bg-gold/10 hover:text-ivory'
                    }`}
                  >
                    <SocialPlatformIcon platform={platform.id} className="h-4 w-4" />
                    {platform.name}
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button — redirects to /admin/social/posts/new */}
          <Link
            href={buildGenerateUrl()}
            className={`bg-gold/20 text-gold hover:bg-gold/30 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition ${
              selectedPlatforms.length === 0 ? 'pointer-events-none opacity-50' : ''
            }`}
            aria-disabled={selectedPlatforms.length === 0}
          >
            <Sparkles className="h-5 w-5" />
            Générer les posts IA
          </Link>

          {selectedPlatforms.length === 0 && (
            <p className="text-ivory/40 text-center text-xs">
              Sélectionnez au moins une plateforme pour continuer
            </p>
          )}
        </div>
      )}
    </div>
  );
}
