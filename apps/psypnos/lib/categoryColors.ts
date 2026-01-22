// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Système de couleurs par catégorie
 * À intégrer dans lib/blog.ts et composants
 *
 * IMPACT: 🔥🔥🔥 Différenciation visuelle claire
 * DIFFICULTÉ: 🟢 Facile (30 min)
 */

export const CATEGORY_COLORS = {
  "Comprendre": {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/70",
    hover: "hover:border-blue-500/90",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  "Traverser": {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/70",
    hover: "hover:border-green-500/90",
    gradient: "from-green-500/20 to-green-500/5",
  },
  "Découvrir": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/70",
    hover: "hover:border-purple-500/90",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  "Cheminer": {
    bg: "bg-gold/10",
    text: "text-gold",
    border: "border-gold/70",
    hover: "hover:border-gold/90",
    gradient: "from-gold/20 to-gold/5",
  },
} as const;

export type Category = keyof typeof CATEGORY_COLORS;

export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category as Category] || CATEGORY_COLORS["Cheminer"];
}

/**
 * UTILISATION dans BlogCard.tsx :
 *
 * import { getCategoryColors } from "@/lib/blog";
 *
 * export function BlogCard({ post }: BlogCardProps) {
 *   const colors = getCategoryColors(post.category);
 *
 *   return (
 *     <motion.article
 *       className={`group relative overflow-hidden rounded-lg border ${colors.border} ${colors.hover} bg-night/50 backdrop-blur-sm`}
 *     >
 *       {/* Barre de couleur à gauche *\/}
 *       <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.gradient}`} />
 *
 *       <Link href={`/blog/${post.slug}`} className="block">
 *         {/* Image *\/}
 *         {imageExists && <img ... />}
 *
 *         <div className="p-6 pl-8">
 *           {/* Badge catégorie avec couleur *\/}
 *           <span className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-3 py-1 text-xs font-medium ${colors.text}`}>
 *             <Tag className="h-3 w-3" />
 *             {post.category}
 *           </span>
 *
 *           {/* Reste du contenu *\/}
 *         </div>
 *       </Link>
 *     </motion.article>
 *   );
 * }
 */

/**
 * AJOUT dans tailwind.config.ts si besoin de couleurs custom :
 *
 * module.exports = {
 *   theme: {
 *     extend: {
 *       colors: {
 *         blue: {
 *           400: '#4A90E2',
 *           500: '#357ABD',
 *         },
 *         green: {
 *           400: '#50C878',
 *           500: '#3FA65F',
 *         },
 *         purple: {
 *           400: '#9B59B6',
 *           500: '#7D3C98',
 *         },
 *       },
 *     },
 *   },
 * }
 */
