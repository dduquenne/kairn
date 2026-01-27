"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Activity,
  Target,
  Globe,
  Bot,
  Sparkles,
  FileText,
} from "lucide-react";

export type TabId = "traffic" | "engagement" | "conversions" | "sources" | "seo" | "blog";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const TABS: Tab[] = [
  {
    id: "traffic",
    label: "Trafic",
    icon: <TrendingUp size={18} />,
    description: "Visiteurs et pages vues",
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: <Activity size={18} />,
    description: "Temps passé et interactions",
  },
  {
    id: "conversions",
    label: "Conversions",
    icon: <Target size={18} />,
    description: "Objectifs et tunnel",
  },
  {
    id: "blog",
    label: "Blog",
    icon: <FileText size={18} />,
    description: "Articles et engagement",
  },
  {
    id: "sources",
    label: "Sources",
    icon: <Globe size={18} />,
    description: "Acquisition et provenance",
  },
  {
    id: "seo",
    label: "SEO",
    icon: <Bot size={18} />,
    description: "Bots et référencement",
  },
];

interface TabNavigationProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onInsightsClick?: () => void;
}

export function TabNavigation({
  activeTab,
  onChange,
  onInsightsClick,
}: TabNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gold/10 mb-4 sm:mb-6 gap-2 sm:gap-0">
      {/* Tabs */}
      <nav className="flex items-center gap-0.5 sm:gap-1 -mb-px overflow-x-auto scrollbar-hide pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "text-gold"
                  : "text-ivory/60 hover:text-ivory"
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              <span
                className={`transition-colors flex-shrink-0 ${
                  isActive ? "text-gold" : "text-ivory/40"
                }`}
              >
                {tab.icon}
              </span>
              <span className="hidden xs:inline sm:inline">{tab.label}</span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Insights Button */}
      {onInsightsClick && (
        <motion.button
          onClick={onInsightsClick}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:border-purple-500/50 transition-colors sm:ml-4 self-end sm:self-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles size={14} className="sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Insights</span>
        </motion.button>
      )}
    </div>
  );
}

// Tab content wrapper with animation
interface TabContentProps {
  children: React.ReactNode;
  tabId: TabId;
}

export function TabContent({ children, tabId }: TabContentProps) {
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
