"use client";

import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  /** Style variant */
  variant?: "default" | "pills" | "underline";
}

const variantStyles = {
  default: {
    container: "flex gap-1 rounded-xl bg-secondary/60 p-1.5 border border-primary/10",
    tab: "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
    active: "text-primary",
    inactive: "text-foreground/60 hover:text-foreground hover:bg-primary/5",
    indicator: "absolute inset-0 rounded-lg bg-primary/15 border border-primary/20",
  },
  pills: {
    container: "flex gap-2",
    tab: "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
    active: "text-background bg-primary",
    inactive: "text-foreground/60 hover:text-foreground hover:bg-muted/20",
    indicator: "",
  },
  underline: {
    container: "flex gap-4 border-b border-muted/20",
    tab: "relative flex items-center gap-2 px-2 py-3 text-sm font-medium transition-all",
    active: "text-primary",
    inactive: "text-foreground/60 hover:text-foreground",
    indicator: "absolute bottom-0 left-0 right-0 h-0.5 bg-primary",
  },
};

export function Tabs({
  items,
  defaultTab,
  onChange,
  className,
  variant = "default"
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const styles = variantStyles[variant];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeItem = items.find((item) => item.id === activeTab);

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className={styles.container}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleTabChange(item.id)}
              disabled={item.disabled}
              className={cn(
                styles.tab,
                isActive ? styles.active : styles.inactive,
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isActive && variant === "default" && (
                <motion.div
                  layoutId="activeTab"
                  className={styles.indicator}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              {isActive && variant === "underline" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className={styles.indicator}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
                {item.badge !== undefined && (
                  <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
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
