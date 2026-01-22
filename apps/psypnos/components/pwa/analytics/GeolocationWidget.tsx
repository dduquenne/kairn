// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { useEffect, useState } from 'react';
import { Globe, MapPin, Users } from 'lucide-react';

interface VisitorLocation {
  id: string;
  sessionId: string;
  timestamp: string;
  country: string;
  countryCode: string;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
}

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
  latitude: number | null;
  longitude: number | null;
}

interface RegionData {
  region: string;
  country: string;
  count: number;
  percentage: number;
}

interface GeolocationData {
  totalVisitors: number;
  visitors: VisitorLocation[];
  byCountry: CountryData[];
  byRegion: RegionData[];
  topCities: CityData[];
}

export default function GeolocationWidget() {
  const [data, setData] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'countries' | 'cities' | 'regions'>('countries');

  useEffect(() => {
    fetchGeolocationData();
  }, []);

  const fetchGeolocationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/geolocation');

      if (!response.ok) {
        throw new Error('Failed to fetch geolocation data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching geolocation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-semibold text-night">Localisation</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-night/60">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-semibold text-night">Localisation</h3>
        </div>
        <div className="text-center text-red-500 py-8">
          <p>Erreur lors du chargement</p>
          {error && <p className="text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-5 w-5 text-gold" />
        <h3 className="text-lg font-semibold text-night">Localisation des visiteurs</h3>
      </div>
      <p className="text-sm text-night/60 mb-6">
        {data.totalVisitors} visiteurs au total
      </p>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gold/20">
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'countries'
                ? 'text-gold border-b-2 border-gold'
                : 'text-night/60 hover:text-night'
            }`}
          >
            Pays
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'cities'
                ? 'text-gold border-b-2 border-gold'
                : 'text-night/60 hover:text-night'
            }`}
          >
            Villes
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'regions'
                ? 'text-gold border-b-2 border-gold'
                : 'text-night/60 hover:text-night'
            }`}
          >
            Régions
          </button>
        </div>
      </div>

      {/* Countries Tab */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {data.byCountry.slice(0, 5).map((country) => (
              <div
                key={country.countryCode}
                className="flex items-center justify-between p-3 rounded-lg bg-gold/5 hover:bg-gold/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold/10">
                    <Globe className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-night">{country.country}</p>
                    <p className="text-sm text-night/60">{country.countryCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-night">{country.count}</p>
                  <p className="text-sm text-night/60">
                    {country.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-3 pt-4">
            <h4 className="font-medium text-sm text-night/60">Distribution</h4>
            {data.byCountry.slice(0, 5).map((country) => (
              <div key={country.countryCode} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-night">{country.country}</span>
                  <span className="text-night/60">{country.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gold/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cities Tab */}
      {activeTab === 'cities' && (
        <div className="space-y-2">
          {data.topCities.slice(0, 8).map((city) => (
            <div
              key={city.city}
              className="flex items-center justify-between p-3 rounded-lg bg-gold/5 hover:bg-gold/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold/10">
                  <MapPin className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-night">{city.city}</p>
                  <p className="text-sm text-night/60">{city.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-night">{city.count}</p>
                <p className="text-sm text-night/60">
                  {city.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="space-y-2">
          {data.byRegion.slice(0, 8).map((region) => (
            <div
              key={region.region}
              className="flex items-center justify-between p-3 rounded-lg bg-gold/5 hover:bg-gold/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold/10">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-night">{region.region}</p>
                  <p className="text-sm text-night/60">{region.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-night">{region.count}</p>
                <p className="text-sm text-night/60">
                  {region.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
