/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
'use client';

import { Globe, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getFrenchDepartment } from '../../../lib/frenchDepartments';

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
  countryCode?: string;
  regionCode?: string;
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
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="text-gold h-5 w-5" />
          <h3 className="text-night text-lg font-semibold">Localisation</h3>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-gold mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-night/60">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="text-gold h-5 w-5" />
          <h3 className="text-night text-lg font-semibold">Localisation</h3>
        </div>
        <div className="py-8 text-center text-red-500">
          <p>Erreur lors du chargement</p>
          {error && <p className="mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Globe className="text-gold h-5 w-5" />
        <h3 className="text-night text-lg font-semibold">Localisation des visiteurs</h3>
      </div>
      <p className="text-night/60 mb-6 text-sm">{data.totalVisitors} visiteurs au total</p>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-gold/20 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'countries'
                ? 'text-gold border-gold border-b-2'
                : 'text-night/60 hover:text-night'
            }`}
          >
            Pays
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'cities'
                ? 'text-gold border-gold border-b-2'
                : 'text-night/60 hover:text-night'
            }`}
          >
            Villes
          </button>
          <button
            onClick={() => setActiveTab('regions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'regions'
                ? 'text-gold border-gold border-b-2'
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
            {data.byCountry.slice(0, 5).map(country => (
              <div
                key={country.countryCode}
                className="bg-gold/5 hover:bg-gold/10 flex items-center justify-between rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gold/10 flex h-10 w-10 items-center justify-center rounded-full">
                    <Globe className="text-gold h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-night font-medium">{country.country}</p>
                    <p className="text-night/60 text-sm">{country.countryCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-night font-semibold">{country.count}</p>
                  <p className="text-night/60 text-sm">{country.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-3 pt-4">
            <h4 className="text-night/60 text-sm font-medium">Distribution</h4>
            {data.byCountry.slice(0, 5).map(country => (
              <div key={country.countryCode} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-night">{country.country}</span>
                  <span className="text-night/60">{country.percentage.toFixed(1)}%</span>
                </div>
                <div className="bg-gold/10 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-gold h-full rounded-full transition-all"
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
          {data.topCities.slice(0, 8).map(city => (
            <div
              key={city.city}
              className="bg-gold/5 hover:bg-gold/10 flex items-center justify-between rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gold/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <MapPin className="text-gold h-5 w-5" />
                </div>
                <div>
                  <p className="text-night font-medium">
                    {city.countryCode === 'FR'
                      ? (() => {
                          const dept = getFrenchDepartment(city.city, city.regionCode);
                          return dept ? `${city.city} (${dept})` : city.city;
                        })()
                      : city.city}
                  </p>
                  <p className="text-night/60 text-sm">{city.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-night font-semibold">{city.count}</p>
                <p className="text-night/60 text-sm">{city.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="space-y-2">
          {data.byRegion.slice(0, 8).map(region => (
            <div
              key={region.region}
              className="bg-gold/5 hover:bg-gold/10 flex items-center justify-between rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gold/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Users className="text-gold h-5 w-5" />
                </div>
                <div>
                  <p className="text-night font-medium">{region.region}</p>
                  <p className="text-night/60 text-sm">{region.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-night font-semibold">{region.count}</p>
                <p className="text-night/60 text-sm">{region.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
