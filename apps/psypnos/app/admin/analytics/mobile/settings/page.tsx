"use client";

import { useState } from "react";
import { Bell, Smartphone, Database, RefreshCw, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MobileSettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      setNotificationsEnabled(false);
    }
  };

  const settingsSections = [
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Alertes Push",
          description: "Recevoir des notifications pour les anomalies",
          value: notificationsEnabled,
          onChange: handleNotificationToggle,
          type: "toggle" as const
        }
      ]
    },
    {
      title: "Données",
      items: [
        {
          icon: RefreshCw,
          label: "Actualisation Auto",
          description: "Rafraîchir automatiquement les données",
          value: autoRefresh,
          onChange: () => setAutoRefresh(!autoRefresh),
          type: "toggle" as const
        },
        {
          icon: Database,
          label: "Cache Local",
          description: "Gérer le stockage hors ligne",
          type: "link" as const,
          onClick: () => {
            if ('caches' in window) {
              caches.keys().then(names => {
                alert(`${names.length} cache(s) actif(s)`);
              });
            }
          }
        }
      ]
    },
    {
      title: "Application",
      items: [
        {
          icon: Smartphone,
          label: "Version PWA",
          description: "1.0.0 - Phase 1",
          type: "info" as const
        },
        {
          icon: ExternalLink,
          label: "Version Bureau",
          description: "Accéder à l'interface complète",
          type: "link" as const,
          href: "/admin/analytics"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ivory mb-1">Réglages</h1>
        <p className="text-sm text-ivory/60">Configuration de la PWA</p>
      </div>

      {settingsSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-3">
          <h2 className="text-sm font-semibold text-ivory/60 uppercase tracking-wide">
            {section.title}
          </h2>

          <div className="space-y-2">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;

              if (item.type === "toggle") {
                return (
                  <motion.button
                    key={itemIndex}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.onChange}
                    className="w-full bg-gold/10 border border-gold/20 rounded-xl p-4 flex items-center justify-between active:bg-gold/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gold" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-ivory">{item.label}</p>
                        <p className="text-xs text-ivory/60">{item.description}</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      item.value ? 'bg-gold' : 'bg-ivory/20'
                    }`}>
                      <motion.div
                        animate={{ x: item.value ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-ivory rounded-full mt-0.5"
                      />
                    </div>
                  </motion.button>
                );
              }

              if (item.type === "link") {
                // Check if it has href (internal link) or onClick (button action)
                const hasHref = 'href' in item && item.href;
                const hasOnClick = 'onClick' in item && item.onClick;

                if (hasHref) {
                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className="block bg-gold/10 border border-gold/20 rounded-xl p-4 active:bg-gold/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gold" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ivory">{item.label}</p>
                          <p className="text-xs text-ivory/60">{item.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-ivory/40" />
                      </div>
                    </Link>
                  );
                } else if (hasOnClick) {
                  return (
                    <motion.button
                      key={itemIndex}
                      onClick={item.onClick}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gold/10 border border-gold/20 rounded-xl p-4 active:bg-gold/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gold" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-ivory">{item.label}</p>
                          <p className="text-xs text-ivory/60">{item.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-ivory/40" />
                      </div>
                    </motion.button>
                  );
                }
              }

              return (
                <div
                  key={itemIndex}
                  className="bg-gold/10 border border-gold/20 rounded-xl p-4 flex items-center gap-3"
                >
                  <Icon className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-ivory">{item.label}</p>
                    <p className="text-xs text-ivory/60">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
