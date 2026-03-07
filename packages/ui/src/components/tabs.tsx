'use client';

import { motion } from 'framer-motion';
import { KeyboardEvent, ReactNode, useCallback, useRef, useState } from 'react';

import { cn } from '../utils/cn';

/** Single tab item configuration */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

/** Props for the Tabs component */
export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  /** Style variant */
  variant?: 'default' | 'pills' | 'underline';
  /** Accessible label for the tablist */
  ariaLabel?: string;
}

const variantStyles = {
  default: {
    container: 'flex gap-1 rounded-xl bg-secondary/60 p-1.5 border border-primary/10',
    tab: 'relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
    active: 'text-primary',
    inactive: 'text-foreground/60 hover:text-foreground hover:bg-primary/5',
    indicator: 'absolute inset-0 rounded-lg bg-primary/15 border border-primary/20',
  },
  pills: {
    container: 'flex gap-2',
    tab: 'relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
    active: 'text-background bg-primary',
    inactive: 'text-foreground/60 hover:text-foreground hover:bg-muted/20',
    indicator: '',
  },
  underline: {
    container: 'flex gap-4 border-b border-muted/20',
    tab: 'relative flex items-center gap-2 px-2 py-3 text-sm font-medium transition-all',
    active: 'text-primary',
    inactive: 'text-foreground/60 hover:text-foreground',
    indicator: 'absolute bottom-0 left-0 right-0 h-0.5 bg-primary',
  },
};

/**
 * Accessible tabbed interface component with WAI-ARIA keyboard navigation.
 * Supports multiple visual variants and disabled tabs.
 */
export function Tabs({
  items,
  defaultTab,
  onChange,
  className,
  variant = 'default',
  ariaLabel,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const styles = variantStyles[variant];
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      onChange?.(tabId);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledItems = items.filter(item => !item.disabled);
      if (enabledItems.length === 0) return;

      const currentIndex = enabledItems.findIndex(item => item.id === activeTab);

      let nextItem: TabItem | undefined;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          nextItem = enabledItems[(currentIndex + 1) % enabledItems.length];
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          nextItem = enabledItems[(currentIndex - 1 + enabledItems.length) % enabledItems.length];
          break;
        }
        case 'Home': {
          e.preventDefault();
          nextItem = enabledItems[0];
          break;
        }
        case 'End': {
          e.preventDefault();
          nextItem = enabledItems[enabledItems.length - 1];
          break;
        }
      }

      if (nextItem) {
        handleTabChange(nextItem.id);
        tabRefs.current.get(nextItem.id)?.focus();
      }
    },
    [items, activeTab, handleTabChange]
  );

  const activeItem = items.find(item => item.id === activeTab);

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div
        className={styles.container}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        {items.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              ref={el => {
                if (el) {
                  tabRefs.current.set(item.id, el);
                }
              }}
              id={`tab-${item.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !item.disabled && handleTabChange(item.id)}
              disabled={item.disabled}
              className={cn(
                styles.tab,
                isActive ? styles.active : styles.inactive,
                item.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {isActive && variant === 'default' && (
                <motion.div
                  layoutId="activeTab"
                  className={styles.indicator}
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                    duration: 0.4,
                  }}
                />
              )}
              {isActive && variant === 'underline' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className={styles.indicator}
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                    duration: 0.4,
                  }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                {item.label}
                {item.badge !== undefined && (
                  <span className="bg-primary/20 text-primary ml-1 rounded-full px-2 py-0.5 text-xs">
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
          <div
            id={`tabpanel-${activeItem.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeItem.id}`}
            tabIndex={0}
          >
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeItem.children}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
