// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";

interface ConversionData {
  type: string;
  clicks: number;
  completed: number;
  rate: number;
}

interface ConversionFunnelProps {
  data: Record<string, { clicks: number; completed: number; rate: number }>;
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const entries = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks);

  const typeLabels: Record<string, string> = {
    appointment_request: "Demande de rendez-vous",
    seminar_registration: "Inscription séminaire",
    contact_form: "Formulaire de contact",
  };

  return (
    <div className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-lg font-semibold text-gold">Entonnoir de conversion</h3>
      <div className="space-y-4">
        {entries.map(([type, data], index) => {

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ivory">
                  {typeLabels[type as keyof typeof typeLabels] || type}
                </span>
                <div className="flex gap-4 text-xs text-ivory/70">
                  <span className="text-gold">{data.clicks} clics</span>
                  <span className="text-green-400 font-semibold">{data.completed} conversions</span>
                  <span className="text-gold font-semibold">{(data.rate ?? 0).toFixed(1)}%</span>
                </div>
              </div>

              <div className="relative h-8 overflow-hidden rounded-lg bg-night/40 border border-gold/10">
                {/* Completed bar (conversion rate) */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                  className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${data.rate}%` }}
                />

                {/* Clicks bar background */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-gold/40 to-gold/20"
                  style={{ width: `100%` }}
                />

                {/* Label */}
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-bold text-ivory/80">
                    {(data.rate ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gold/10">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-ivory/70">Total clics</p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {entries.reduce((sum, [, data]) => sum + data.clicks, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ivory/70">Conversions totales</p>
            <p className="mt-1 text-2xl font-bold text-green-400">
              {entries.reduce((sum, [, data]) => sum + data.completed, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ivory/70">Taux moyen</p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {entries.length > 0
                ? (
                    entries.reduce((sum, [, data]) => sum + data.rate, 0) / entries.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
