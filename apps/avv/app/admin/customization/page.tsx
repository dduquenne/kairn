'use client';

import { CustomizationPanel } from '@kairn/admin';
import type { CustomizationConfig } from '@kairn/config';
import { motion } from 'framer-motion';
import { Palette, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

export default function CustomizationPage() {
  const [initialConfig, setInitialConfig] = useState<Partial<CustomizationConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/customization');
      if (response.ok) {
        const data = await response.json();
        setInitialConfig(data.customization || null);
      } else {
        setError('Erreur lors du chargement de la configuration');
      }
    } catch (err) {
      console.error('Error fetching customization:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (config: CustomizationConfig) => {
    const response = await fetch('/api/admin/customization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la sauvegarde');
    }

    // Refresh config after save
    await fetchConfig();
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/admin/customization', {
        method: 'DELETE',
      });

      if (response.ok) {
        setInitialConfig(null);
      }
    } catch (err) {
      console.error('Error resetting customization:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="border-gold h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-ivory/60 text-sm">Chargement des parametres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="text-center text-red-400">
          <p className="font-medium">{error}</p>
          <p className="text-ivory/50 mt-2 text-sm">Verifiez votre connexion et reessayez</p>
        </div>
        <button
          onClick={fetchConfig}
          className="bg-gold/20 text-gold hover:bg-gold/30 rounded-lg px-4 py-2 transition-colors"
        >
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/admin/settings"
            className="bg-night/60 border-ivory/10 text-ivory/60 hover:text-ivory hover:border-ivory/30 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="to-gold/20 hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/20 via-pink-500/20 sm:flex">
            <Palette className="h-7 w-7 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-ivory text-xl font-bold sm:text-2xl">Personnalisation</h1>
            <p className="text-ivory/60 text-sm">Configurez l'apparence visuelle de votre site</p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-2 sm:flex">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-ivory/70 text-sm">Apercu en temps reel</span>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-ivory/10 from-night/80 to-night/60 rounded-2xl border bg-gradient-to-r p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-ivory mb-2 text-lg font-semibold">
              Personnalisez votre identite visuelle
            </h2>
            <p className="text-ivory/60 text-sm">
              Modifiez les couleurs, polices, mise en page et effets visuels de votre site. Toutes
              les modifications sont visibles en temps reel dans l'apercu. N'oubliez pas
              d'enregistrer vos changements pour les appliquer.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
              <span className="text-ivory/50 text-xs">Modifications non sauvegardees</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customization Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CustomizationPanel
          initialConfig={initialConfig || undefined}
          onSave={handleSave}
          onReset={handleReset}
          siteUrl="https://appreciezvotrevie.fr"
        />
      </motion.div>
    </div>
  );
}
