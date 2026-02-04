"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";

import { cn } from "../utils/cn";

export interface AccordionItem {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple sections to be open simultaneously */
  allowMultiple?: boolean;
  className?: string;
  /** Style variant */
  variant?: "default" | "bordered" | "separated";
}

const variantStyles = {
  default: {
    container: "space-y-2",
    item: "rounded-lg border border-primary/20 bg-gradient-to-br from-secondary/60 to-secondary/40 backdrop-blur-sm overflow-hidden",
    header: "w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition text-left",
    title: "text-lg font-semibold text-foreground",
    content: "px-6 pb-6 border-t border-primary/10 pt-6",
  },
  bordered: {
    container: "border border-primary/20 rounded-lg divide-y divide-primary/10 overflow-hidden",
    item: "",
    header: "w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition text-left",
    title: "text-lg font-semibold text-foreground",
    content: "px-6 pb-6 pt-4",
  },
  separated: {
    container: "space-y-4",
    item: "rounded-xl border border-primary/10 bg-secondary/30 overflow-hidden shadow-sm",
    header: "w-full px-6 py-5 flex items-center justify-between hover:bg-primary/5 transition text-left",
    title: "text-lg font-semibold text-foreground",
    content: "px-6 pb-6 pt-2",
  },
};

export function Accordion({
  items,
  allowMultiple = false,
  className,
  variant = "default"
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
    <div className={cn(styles.container, className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id} className={styles.item}>
            {/* Header */}
            <button
              onClick={() => toggleItem(item.id)}
              className={styles.header}
            >
              <h3 className={styles.title}>{item.title}</h3>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-primary transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className={styles.content}>
                {item.children}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
