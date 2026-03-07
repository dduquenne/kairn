'use client';

import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { cn } from '../utils/cn';

/**
 * Represents a single item within an accordion component.
 * Each item has a unique identifier, a title, and expandable content.
 */
export interface AccordionItem {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Props for the Accordion component.
 * Supports multiple style variants and optional multi-expand behavior.
 */
export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple sections to be open simultaneously */
  allowMultiple?: boolean;
  className?: string;
  /** Style variant */
  variant?: 'default' | 'bordered' | 'separated';
  /** Accessible label for the accordion region */
  ariaLabel?: string;
}

const variantStyles = {
  default: {
    container: 'space-y-2',
    item: 'rounded-lg border border-primary/20 bg-gradient-to-br from-secondary/60 to-secondary/40 backdrop-blur-sm overflow-hidden',
    header:
      'w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition text-left',
    title: 'text-lg font-semibold text-foreground',
    content: 'px-6 pb-6 border-t border-primary/10 pt-6',
  },
  bordered: {
    container: 'border border-primary/20 rounded-lg divide-y divide-primary/10 overflow-hidden',
    item: '',
    header:
      'w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition text-left',
    title: 'text-lg font-semibold text-foreground',
    content: 'px-6 pb-6 pt-4',
  },
  separated: {
    container: 'space-y-4',
    item: 'rounded-xl border border-primary/10 bg-secondary/30 overflow-hidden shadow-sm',
    header:
      'w-full px-6 py-5 flex items-center justify-between hover:bg-primary/5 transition text-left',
    title: 'text-lg font-semibold text-foreground',
    content: 'px-6 pb-6 pt-2',
  },
};

/**
 * Accessible accordion component compliant with WCAG 2.1 AA.
 * Uses proper ARIA attributes (aria-expanded, aria-controls, aria-labelledby)
 * and heading-button structure to ensure screen reader compatibility
 * and keyboard navigation support.
 */
export function Accordion({
  items,
  allowMultiple = false,
  className,
  variant = 'default',
  ariaLabel,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultOpen).map(item => item.id))
  );

  const styles = variantStyles[variant];

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);

    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      if (!allowMultiple) {
        newOpenItems.clear();
      }
      newOpenItems.add(id);
    }

    setOpenItems(newOpenItems);
  };

  return (
    <div className={cn(styles.container, className)} role="region" aria-label={ariaLabel}>
      {items.map(item => {
        const isOpen = openItems.has(item.id);
        const headerId = `accordion-header-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div key={item.id} className={styles.item}>
            {/* Header */}
            <h3>
              <button
                id={headerId}
                onClick={() => toggleItem(item.id)}
                className={styles.header}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className={styles.title}>{item.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'text-primary h-5 w-5 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
            </h3>

            {/* Content */}
            <div id={panelId} role="region" aria-labelledby={headerId} hidden={!isOpen}>
              {isOpen && <div className={styles.content}>{item.children}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
