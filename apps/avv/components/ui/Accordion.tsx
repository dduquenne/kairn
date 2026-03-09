/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean; // Permettre plusieurs sections ouvertes simultanément
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className = "" }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultOpen).map(item => item.id))
  );

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
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div
            key={item.id}
            className="rounded-lg border border-gold/20 bg-gradient-to-br from-night/60 to-night/40 backdrop-blur-sm overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gold/5 transition text-left"
            >
              <h3 className="text-lg font-semibold text-ivory">{item.title}</h3>
              <ChevronDown
                className={`h-5 w-5 text-gold transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="px-6 pb-6 border-t border-gold/10 pt-6">
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
