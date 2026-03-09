/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { getFrenchDepartment } from '../../lib/frenchDepartments';

interface CountryData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

interface CityData {
  city: string;
  country: string;
  countryCode?: string;
  regionCode?: string;
  count: number;
  percentage: number;
}

interface GeolocationCondensedProps {
  className?: string;
}

// Country flag emoji helper
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function GeolocationCondensed({ className = '' }: GeolocationCondensedProps) {
  const [data, setData] = useState<{
    totalVisitors: number;
    byCountry: CountryData[];
    topCities: CityData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/geolocation');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching geolocation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gold/5 border-gold/20 animate-pulse rounded-2xl border p-4 ${className}`}>
        <div className="bg-gold/10 mb-2 h-6 w-1/3 rounded" />
        <div className="bg-gold/10 h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (!data || data.byCountry.length === 0) {
    return (
      <div className={`bg-gold/5 border-gold/20 rounded-2xl border p-4 ${className}`}>
        <div className="text-ivory/50 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <span className="text-sm">Aucune donnée de localisation</span>
        </div>
      </div>
    );
  }

  // Get top country and city
  const topCountry = data.byCountry[0];
  const topCity = data.topCities?.[0];
  const otherCountriesCount = data.byCountry.slice(1).reduce((sum, c) => sum + c.count, 0);
  const otherCountriesPercentage = data.byCountry
    .slice(1)
    .reduce((sum, c) => sum + c.percentage, 0);

  // Summary text
  const summaryText = topCity
    ? `${topCountry.percentage.toFixed(0)}% ${topCountry.country}${
        topCity ? ` (${topCity.percentage.toFixed(0)}% ${topCity.city})` : ''
      }`
    : `${topCountry.percentage.toFixed(0)}% ${topCountry.country}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gold/5 border-gold/20 overflow-hidden rounded-2xl border ${className}`}
    >
      {/* Condensed header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="active:bg-gold/10 flex w-full items-center justify-between p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 rounded-xl p-2">
            <Globe className="text-gold h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-ivory/50 text-xs font-medium uppercase tracking-wide">
              Localisation
            </p>
            <p className="text-ivory text-sm font-semibold">{summaryText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini country flags */}
          <div className="flex -space-x-1">
            {data.byCountry.slice(0, 3).map(country => (
              <span key={country.countryCode} className="text-lg" title={country.country}>
                {getCountryFlag(country.countryCode)}
              </span>
            ))}
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="text-ivory/40 h-5 w-5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">
              {/* Top 3 countries */}
              <div className="space-y-2">
                <p className="text-ivory/40 text-xs font-medium uppercase tracking-wide">
                  Top Pays
                </p>
                {data.byCountry.slice(0, 3).map((country, index) => (
                  <div
                    key={country.countryCode}
                    className="bg-gold/5 flex items-center justify-between rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
                      <span className="text-ivory text-sm font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-gold/10 h-1.5 w-20 overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${country.percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="bg-gold h-full rounded-full"
                        />
                      </div>
                      <span className="text-ivory/60 w-12 text-right text-sm">
                        {country.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top cities */}
              {data.topCities && data.topCities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-ivory/40 text-xs font-medium uppercase tracking-wide">
                    Top Villes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.topCities.slice(0, 4).map(city => (
                      <div
                        key={city.city}
                        className="bg-gold/5 border-gold/10 flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                      >
                        <MapPin className="text-gold/60 h-3 w-3" />
                        <span className="text-ivory text-xs">
                          {city.countryCode === 'FR'
                            ? (() => {
                                const dept = getFrenchDepartment(city.city, city.regionCode);
                                return dept ? `${city.city} (${dept})` : city.city;
                              })()
                            : city.city}
                        </span>
                        <span className="text-ivory/40 text-xs">{city.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* See more link */}
              <Link
                href="/admin/analytics/mobile/geo"
                className="text-gold/70 hover:text-gold flex items-center justify-center gap-1 pt-2 text-xs transition-colors"
              >
                Voir le détail complet
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
