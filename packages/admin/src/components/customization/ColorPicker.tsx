'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, Check, Copy, Palette } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  showCopyButton?: boolean;
}

const DEFAULT_PRESETS = [
  '#C7A962', '#E5C78E', '#0E1F2F', '#F5F1E6',
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#22C55E', '#06B6D4', '#6366F1',
];

export function ColorPicker({
  label,
  description,
  value,
  onChange,
  presetColors = DEFAULT_PRESETS,
  showCopyButton = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value.toUpperCase();
    setInputValue(color);
    onChange(color);
  }, [onChange]);

  const handlePresetClick = useCallback((color: string) => {
    setInputValue(color);
    onChange(color);
  }, [onChange]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const isLight = getLuminance(value) > 0.5;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-ivory mb-1.5">
        {label}
      </label>
      {description && (
        <p className="text-xs text-ivory/50 mb-2">{description}</p>
      )}

      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative h-12 w-12 rounded-xl overflow-hidden border-2 border-ivory/20 transition-all hover:border-ivory/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/50"
          style={{ backgroundColor: value }}
        >
          <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-black/20' : 'bg-white/20'}`}>
            <Pipette className={`h-5 w-5 ${isLight ? 'text-black' : 'text-white'}`} />
          </div>
        </button>

        {/* Hex input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full h-12 px-4 rounded-xl bg-night/60 border border-ivory/20 text-ivory font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            placeholder="#000000"
            maxLength={7}
          />
          {/* Hidden native color picker */}
          <input
            type="color"
            value={value}
            onChange={handleColorPickerChange}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer opacity-0"
            title="Choisir une couleur"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Palette className="h-5 w-5 text-ivory/40" />
          </div>
        </div>

        {/* Copy button */}
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="h-12 w-12 flex items-center justify-center rounded-xl bg-night/60 border border-ivory/20 text-ivory/60 hover:text-ivory hover:border-ivory/40 transition-all"
            title="Copier la couleur"
          >
            {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 p-4 rounded-2xl bg-night/95 border border-ivory/20 shadow-2xl z-50 backdrop-blur-sm"
          >
            {/* Color spectrum */}
            <div className="mb-4">
              <div className="text-xs text-ivory/50 mb-2">Spectre de couleurs</div>
              <div className="h-32 rounded-xl overflow-hidden relative">
                <input
                  type="color"
                  value={value}
                  onChange={handleColorPickerChange}
                  className="absolute inset-0 w-full h-full cursor-pointer"
                  style={{ padding: 0, border: 'none' }}
                />
              </div>
            </div>

            {/* Preset colors */}
            <div>
              <div className="text-xs text-ivory/50 mb-2">Couleurs prédéfinies</div>
              <div className="grid grid-cols-6 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handlePresetClick(color)}
                    className={`group relative h-8 w-full rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                      value.toUpperCase() === color.toUpperCase() ? 'ring-2 ring-gold ring-offset-2 ring-offset-night' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {value.toUpperCase() === color.toUpperCase() && (
                      <Check className={`absolute inset-0 m-auto h-4 w-4 ${getLuminance(color) > 0.5 ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ColorPicker;
