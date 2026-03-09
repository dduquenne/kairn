/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  children: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, defaultTab, onChange, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeItem = items.find((item) => item.id === activeTab);

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-night/60 p-1.5 border border-gold/10">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "text-gold"
                  : "text-ivory/60 hover:text-ivory hover:bg-gold/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-gold/15 border border-gold/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
                {item.badge !== undefined && (
                  <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeItem && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeItem.children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
