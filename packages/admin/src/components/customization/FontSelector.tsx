'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Type, Check, Search } from 'lucide-react';
import { AVAILABLE_FONTS } from '@kairn/config';

interface FontSelectorProps {
  label: string;
  description?: string;
  value: string;
  onChange: (font: string) => void;
  category: 'display' | 'body' | 'mono';
  previewText?: string;
}

export function FontSelector({
  label,
  description,
  value,
  onChange,
  category,
  previewText = 'Apercu du texte',
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const fonts = AVAILABLE_FONTS[category];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFonts = fonts.filter((font) =>
    font.name.toLowerCase().includes(search.toLowerCase()) ||
    font.style.toLowerCase().includes(search.toLowerCase())
  );

  const selectedFont = fonts.find((f) => f.name === value);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-ivory mb-1.5">
        {label}
      </label>
      {description && (
        <p className="text-xs text-ivory/50 mb-2">{description}</p>
      )}

      {/* Selected font button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 h-14 px-4 rounded-xl bg-night/60 border border-ivory/20 text-ivory transition-all hover:border-ivory/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
            <Type className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium truncate">{value}</div>
            {selectedFont && (
              <div className="text-xs text-ivory/50 flex items-center gap-2">
                <span className="capitalize">{selectedFont.category}</span>
                <span className="text-ivory/30">|</span>
                <span className="capitalize">{selectedFont.style}</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-ivory/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Preview */}
      <div
        className="mt-3 p-4 rounded-xl bg-ivory/5 border border-ivory/10"
        style={{ fontFamily: `'${value}', ${category === 'mono' ? 'monospace' : category === 'display' ? 'serif' : 'sans-serif'}` }}
      >
        <div className="text-2xl text-ivory mb-1" style={{ fontWeight: category === 'display' ? 700 : 400 }}>
          {previewText}
        </div>
        <div className="text-sm text-ivory/60">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl bg-night/95 border border-ivory/20 shadow-2xl z-50 backdrop-blur-sm overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-ivory/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une police..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-night/60 border border-ivory/20 text-ivory text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Font list */}
            <div className="max-h-64 overflow-y-auto p-2">
              {filteredFonts.length === 0 ? (
                <div className="text-center py-6 text-ivory/50 text-sm">
                  Aucune police trouvee
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFonts.map((font) => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => {
                        onChange(font.name);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        value === font.name
                          ? 'bg-gold/20 text-ivory'
                          : 'hover:bg-ivory/5 text-ivory/80 hover:text-ivory'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div
                          className="text-lg mb-0.5"
                          style={{ fontFamily: `'${font.name}', ${font.category}` }}
                        >
                          {font.name}
                        </div>
                        <div className="text-xs text-ivory/50 flex items-center gap-2">
                          <span className="capitalize">{font.category}</span>
                          <span className="text-ivory/30">|</span>
                          <span className="capitalize">{font.style}</span>
                        </div>
                      </div>
                      {value === font.name && (
                        <Check className="h-5 w-5 text-gold flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FontSelector;
