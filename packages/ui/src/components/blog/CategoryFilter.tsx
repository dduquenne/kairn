"use client";

import { type ElementType } from "react";

import { cn } from "../../utils/cn";

export interface CategoryFilterProps {
  /** Available categories */
  categories: string[];
  /** Currently selected category (null for "all") */
  selectedCategory: string | null;
  /** Callback when category is selected */
  onSelectCategory: (category: string | null) => void;
  /** Label for "all" option */
  allLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom button class name */
  buttonClassName?: string;
  /** Motion component for animations */
  motionComponent?: ElementType;
}

/**
 * Category filter component for filtering blog posts
 *
 * @example
 * ```tsx
 * <CategoryFilter
 *   categories={["Tech", "Design", "Business"]}
 *   selectedCategory={selectedCategory}
 *   onSelectCategory={setSelectedCategory}
 * />
 * ```
 */
export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  allLabel = "All posts",
  className,
  buttonClassName,
  motionComponent: Motion,
}: CategoryFilterProps) {
  const Button = Motion ?? "button";

  const baseButtonClass = cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-all",
    "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
  );

  const activeClass = "bg-gold text-night";
  const inactiveClass =
    "bg-ivory/5 text-ivory/70 hover:bg-ivory/10 hover:text-ivory";

  return (
    <div className={cn("mb-8 flex flex-wrap gap-3", className)}>
      {/* All option */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={cn(
          baseButtonClass,
          selectedCategory === null ? activeClass : inactiveClass,
          buttonClassName
        )}
      >
        {allLabel}
      </button>

      {/* Category buttons */}
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const buttonProps = Motion
          ? {
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 },
            }
          : {};

        return (
          <Button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={cn(
              baseButtonClass,
              isSelected ? activeClass : inactiveClass,
              buttonClassName
            )}
            {...buttonProps}
          >
            {category}
          </Button>
        );
      })}
    </div>
  );
}

