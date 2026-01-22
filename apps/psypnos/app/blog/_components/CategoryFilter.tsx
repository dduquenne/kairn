"use client";

import { motion } from "framer-motion";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <button
        onClick={() => onSelectCategory(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
          selectedCategory === null
            ? "bg-gold text-night"
            : "bg-ivory/5 text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
        }`}
      >
        Tous les articles
      </button>

      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => onSelectCategory(category)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === category
              ? "bg-gold text-night"
              : "bg-ivory/5 text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
          }`}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
}
