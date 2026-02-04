/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface CountryData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

interface CityData {
  city: string;
  country: string;
  count: number;
  percentage: number;
}

interface GeolocationCondensedProps {
  className?: string;
}

// Country flag emoji helper
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function GeolocationCondensed({ className = "" }: GeolocationCondensedProps) {
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
      const response = await fetch("/api/analytics/geolocation");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching geolocation:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gold/5 border border-gold/20 rounded-2xl p-4 animate-pulse ${className}`}>
        <div className="h-6 bg-gold/10 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gold/10 rounded w-2/3" />
      </div>
    );
  }

  if (!data || data.byCountry.length === 0) {
    return (
      <div className={`bg-gold/5 border border-gold/20 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-ivory/50">
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
        topCity ? ` (${topCity.percentage.toFixed(0)}% ${topCity.city})` : ""
      }`
    : `${topCountry.percentage.toFixed(0)}% ${topCountry.country}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gold/5 border border-gold/20 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Condensed header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between active:bg-gold/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold/10">
            <Globe className="h-5 w-5 text-gold" />
          </div>
          <div className="text-left">
            <p className="text-xs text-ivory/50 uppercase tracking-wide font-medium">
              Localisation
            </p>
            <p className="text-sm font-semibold text-ivory">{summaryText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini country flags */}
          <div className="flex -space-x-1">
            {data.byCountry.slice(0, 3).map((country) => (
              <span
                key={country.countryCode}
                className="text-lg"
                title={country.country}
              >
                {getCountryFlag(country.countryCode)}
              </span>
            ))}
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-ivory/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Top 3 countries */}
              <div className="space-y-2">
                <p className="text-xs text-ivory/40 uppercase tracking-wide font-medium">
                  Top Pays
                </p>
                {data.byCountry.slice(0, 3).map((country, index) => (
                  <div
                    key={country.countryCode}
                    className="flex items-center justify-between bg-gold/5 rounded-lg p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
                      <span className="text-sm text-ivory font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-gold/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${country.percentage}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gold rounded-full"
                        />
                      </div>
                      <span className="text-sm text-ivory/60 w-12 text-right">
                        {country.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top cities */}
              {data.topCities && data.topCities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-ivory/40 uppercase tracking-wide font-medium">
                    Top Villes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.topCities.slice(0, 4).map((city) => (
                      <div
                        key={city.city}
                        className="flex items-center gap-1.5 bg-gold/5 border border-gold/10 rounded-full px-3 py-1.5"
                      >
                        <MapPin className="h-3 w-3 text-gold/60" />
                        <span className="text-xs text-ivory">{city.city}</span>
                        <span className="text-xs text-ivory/40">{city.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* See more link */}
              <Link
                href="/admin/analytics/mobile/geo"
                className="flex items-center justify-center gap-1 text-xs text-gold/70 hover:text-gold transition-colors pt-2"
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
