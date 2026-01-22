// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, ExternalLink, Settings, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";

interface ClarityIntegrationProps {
  clarityProjectId?: string;
}

export function ClarityIntegration({ clarityProjectId }: ClarityIntegrationProps) {
  const [isConfigured, setIsConfigured] = useState(!!clarityProjectId);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const clarityScript = `<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "YOUR_PROJECT_ID");
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(clarityScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Video className="text-gold" size={24} />
          <h3 className="text-lg font-semibold text-gold">Session Replay (Clarity)</h3>
        </div>
        {isConfigured && (
          <a
            href="https://clarity.microsoft.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition"
          >
            Ouvrir Clarity
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Status */}
      <div className={`rounded-lg p-4 mb-6 ${
        isConfigured
          ? "bg-green-500/10 border border-green-500/30"
          : "bg-yellow-500/10 border border-yellow-500/30"
      }`}>
        <div className="flex items-center gap-3">
          {isConfigured ? (
            <>
              <CheckCircle className="text-green-400" size={20} />
              <div>
                <p className="text-green-300 font-medium">Clarity est configuré</p>
                <p className="text-green-300/70 text-sm">
                  Les enregistrements de sessions sont actifs
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-yellow-400" size={20} />
              <div>
                <p className="text-yellow-300 font-medium">Configuration requise</p>
                <p className="text-yellow-300/70 text-sm">
                  Ajoutez le script Clarity pour activer les enregistrements
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4">
          <Video className="text-gold mb-2" size={20} />
          <h4 className="font-medium text-ivory text-sm">Session Recordings</h4>
          <p className="text-xs text-ivory/60 mt-1">
            Regardez comment les utilisateurs interagissent avec votre site
          </p>
        </div>
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4">
          <Settings className="text-gold mb-2" size={20} />
          <h4 className="font-medium text-ivory text-sm">Heatmaps</h4>
          <p className="text-xs text-ivory/60 mt-1">
            Visualisez où les utilisateurs cliquent et scrollent
          </p>
        </div>
        <div className="rounded-lg bg-night/50 border border-gold/10 p-4">
          <AlertCircle className="text-gold mb-2" size={20} />
          <h4 className="font-medium text-ivory text-sm">Dead Clicks</h4>
          <p className="text-xs text-ivory/60 mt-1">
            Identifiez les clics sur des éléments non-interactifs
          </p>
        </div>
      </div>

      {/* Setup Guide Toggle */}
      <button
        onClick={() => setShowSetupGuide(!showSetupGuide)}
        className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition"
      >
        <Settings size={16} />
        {showSetupGuide ? "Masquer" : "Afficher"} le guide de configuration
      </button>

      {/* Setup Guide */}
      {showSetupGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-4"
        >
          <div className="rounded-lg bg-night/70 border border-gold/20 p-4">
            <h4 className="font-medium text-ivory mb-3">Étapes de configuration</h4>
            <ol className="space-y-3 text-sm text-ivory/80">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                  1
                </span>
                <span>
                  Créez un compte sur{" "}
                  <a
                    href="https://clarity.microsoft.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    clarity.microsoft.com
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                  2
                </span>
                <span>Créez un nouveau projet pour votre site web</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                  3
                </span>
                <span>Copiez votre Project ID depuis les paramètres du projet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                  4
                </span>
                <span>
                  Ajoutez la variable d'environnement:{" "}
                  <code className="px-2 py-0.5 rounded bg-night text-gold text-xs">
                    NEXT_PUBLIC_CLARITY_PROJECT_ID=votre_id
                  </code>
                </span>
              </li>
            </ol>
          </div>

          {/* Script Example */}
          <div className="rounded-lg bg-night/70 border border-gold/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-ivory text-sm">Script Clarity (référence)</h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copié!" : "Copier"}
              </button>
            </div>
            <pre className="text-xs text-ivory/70 overflow-x-auto p-3 rounded bg-night/50">
              {clarityScript}
            </pre>
            <p className="text-xs text-ivory/50 mt-2">
              Note: Ce script est déjà intégré si vous utilisez la variable d'environnement
            </p>
          </div>

          {/* Custom Events */}
          <div className="rounded-lg bg-night/70 border border-gold/20 p-4">
            <h4 className="font-medium text-ivory text-sm mb-2">Événements personnalisés</h4>
            <p className="text-xs text-ivory/70 mb-3">
              Vous pouvez envoyer des événements personnalisés à Clarity pour mieux segmenter vos enregistrements:
            </p>
            <pre className="text-xs text-ivory/70 overflow-x-auto p-3 rounded bg-night/50">
{`// Dans votre code React
if (typeof window !== 'undefined' && window.clarity) {
  // Identifier l'utilisateur (optionnel)
  window.clarity("identify", "user-id", "session-id", "page-id");

  // Envoyer un événement personnalisé
  window.clarity("set", "custom_tag", "value");

  // Marquer une conversion
  window.clarity("set", "conversion", "true");
}`}
            </pre>
          </div>
        </motion.div>
      )}

      {/* Dashboard Link */}
      {isConfigured && (
        <div className="mt-6 pt-6 border-t border-gold/20">
          <a
            href="https://clarity.microsoft.com/projects/view"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-gold/20 border border-gold/50 px-4 py-3 font-medium text-gold hover:bg-gold/30 transition"
          >
            <Video size={18} />
            Voir les enregistrements dans Clarity
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

// Clarity Provider Component for app-wide integration
export function ClarityProvider({ projectId }: { projectId?: string }) {
  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return;

    // Check if Clarity is already loaded
    if ((window as any).clarity) return;

    // Load Clarity script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");
    `;
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [projectId]);

  return null;
}

// Utility hook for Clarity custom events
export function useClarityEvents() {
  const identify = (userId: string, sessionId?: string, pageId?: string) => {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      (window as any).clarity("identify", userId, sessionId, pageId);
    }
  };

  const setTag = (key: string, value: string) => {
    if (typeof window !== 'undefined' && (window as any).clarity) {
      (window as any).clarity("set", key, value);
    }
  };

  const trackConversion = () => {
    setTag("conversion", "true");
  };

  const trackEvent = (eventName: string, eventValue?: string) => {
    setTag(eventName, eventValue || "true");
  };

  return {
    identify,
    setTag,
    trackConversion,
    trackEvent,
  };
}
