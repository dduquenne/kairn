'use client';

import { motion } from 'framer-motion';
import { Bell, Target, Share2, Users } from 'lucide-react';

/** Identifiant d'un onglet de configuration */
export type ConfigTabId = 'alerts' | 'goals' | 'social' | 'users';

interface Tab {
  id: ConfigTabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'alerts',
    label: 'Alertes',
    icon: <Bell size={18} />,
    description: 'Notifications automatiques',
  },
  {
    id: 'goals',
    label: 'Objectifs',
    icon: <Target size={18} />,
    description: 'Suivi des performances',
  },
  {
    id: 'social',
    label: 'Réseaux sociaux',
    icon: <Share2 size={18} />,
    description: 'Connexion et publication',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: <Users size={18} />,
    description: 'Gestion des accès',
  },
];

/** Props du composant de navigation par onglets */
export interface ConfigurationTabNavigationProps {
  activeTab: ConfigTabId;
  onChange: (tab: ConfigTabId) => void;
  badges?: Partial<Record<ConfigTabId, number>>;
}

/**
 * Navigation par onglets pour la page de configuration admin.
 * Affiche des onglets avec icônes, labels et badges optionnels.
 */
export function ConfigurationTabNavigation({
  activeTab,
  onChange,
  badges = {},
}: ConfigurationTabNavigationProps) {
  return (
    <div className="border-gold/10 mb-6 border-b">
      <nav className="scrollbar-hide -mb-px flex items-center gap-1 overflow-x-auto pb-px">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const badge = badges[tab.id];

          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                isActive ? 'text-gold' : 'text-ivory/60 hover:text-ivory'
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <span
                className={`flex-shrink-0 transition-colors ${
                  isActive ? 'text-gold' : 'text-ivory/40'
                }`}
              >
                {tab.icon}
              </span>
              <span className="xs:inline hidden sm:inline">{tab.label}</span>

              {/* Badge */}
              {badge !== undefined && badge > 0 && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isActive ? 'bg-gold/20 text-gold' : 'bg-ivory/10 text-ivory/50'
                  }`}
                >
                  {badge}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeConfigTab"
                  className="bg-gold absolute bottom-0 left-0 right-0 h-0.5"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
