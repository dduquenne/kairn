"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Eye } from "lucide-react";

interface JsonLdEditorProps {
  value?: Record<string, any>;
  onChange: (value?: Record<string, any>) => void;
  defaultJsonLd: Record<string, any>;
}

export function JsonLdEditor({ value, onChange, defaultJsonLd }: JsonLdEditorProps) {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Initialiser avec le JSON-LD personnalisé ou par défaut
    const initialJson = value || defaultJsonLd;
    setJsonString(JSON.stringify(initialJson, null, 2));
  }, []);

  const handleChange = (newValue: string) => {
    setJsonString(newValue);

    try {
      if (!newValue.trim()) {
        // Si vide, utiliser le JSON-LD par défaut
        onChange(undefined);
        setError("");
        return;
      }

      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setError("");
    } catch (e) {
      setError("JSON invalide");
      // Ne pas appeler onChange si le JSON est invalide
    }
  };

  const resetToDefault = () => {
    setJsonString(JSON.stringify(defaultJsonLd, null, 2));
    onChange(undefined);
    setError("");
  };

  const finalJsonLd = value || defaultJsonLd;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ivory">JSON-LD (Schema.org)</h3>
          <p className="text-sm text-ivory/60">
            Personnalisez les métadonnées structurées pour les moteurs de recherche
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              showPreview
                ? "bg-gold/20 text-gold"
                : "bg-night/50 text-ivory/70 hover:bg-gold/10"
            }`}
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="rounded-lg border border-gold/30 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Éditeur */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gold">
            Éditeur JSON-LD
          </label>
          <div className="relative">
            <textarea
              value={jsonString}
              onChange={(e) => handleChange(e.target.value)}
              rows={20}
              className={`w-full rounded-lg border bg-night/50 px-4 py-3 font-mono text-sm text-ivory placeholder-ivory/40 transition focus:outline-none ${
                error
                  ? "border-red-500/50 focus:border-red-400"
                  : "border-gold/20 focus:border-gold"
              }`}
              placeholder='{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  ...\n}'
              spellCheck={false}
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {!error && jsonString.trim() && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-4 w-4" />
                JSON valide
              </div>
            )}
          </div>
        </div>

        {/* Prévisualisation */}
        {showPreview && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gold">
              Aperçu du résultat final
            </label>
            <div className="rounded-lg border border-gold/20 bg-night/30 p-4">
              <pre className="overflow-x-auto text-xs text-ivory/80">
                {JSON.stringify(finalJsonLd, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <details className="rounded-lg border border-gold/20 bg-night/30 p-4">
        <summary className="cursor-pointer text-sm font-medium text-gold">
          À propos du JSON-LD
        </summary>
        <div className="mt-3 space-y-2 text-xs text-ivory/70">
          <p>
            JSON-LD (JavaScript Object Notation for Linked Data) permet de fournir
            des informations structurées aux moteurs de recherche.
          </p>
          <p>
            Les champs principaux pour un article de blog :
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="text-gold">@context</code>: Toujours &quot;https://schema.org&quot;</li>
            <li><code className="text-gold">@type</code>: &quot;Article&quot; pour un article de blog</li>
            <li><code className="text-gold">headline</code>: Titre de l&apos;article</li>
            <li><code className="text-gold">description</code>: Description de l&apos;article</li>
            <li><code className="text-gold">datePublished</code>: Date de publication</li>
            <li><code className="text-gold">author</code>: Informations sur l&apos;auteur</li>
            <li><code className="text-gold">publisher</code>: Informations sur l&apos;éditeur</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
