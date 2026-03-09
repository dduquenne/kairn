'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { BookOpen, List } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

import type { BlogPostSummary } from '@/lib/blog';

import { CurrentYear } from '../../../components/CurrentYear';
import { NavigationMenu } from '../../../components/NavigationMenu';

import { BlogListItem } from './BlogListItem';
import { Breadcrumb } from './Breadcrumb';
import { CategoryFilter } from './CategoryFilter';
import { FeaturedCarousel } from './FeaturedCarousel';
import { Pagination } from './Pagination';
import { SearchBar } from './SearchBar';


interface BlogPageClientProps {
  allPosts: BlogPostSummary[];
  categories: string[];
}

const POSTS_PER_PAGE = 10;

export function BlogPageClient({ allPosts, categories }: BlogPageClientProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchFilteredPosts, setSearchFilteredPosts] = useState<BlogPostSummary[]>(allPosts);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);

  // Track mounting to enable animations only after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effets parallaxes pour le hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const secondaryParallax = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const imageParallax = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 0.1]);

  // Animation props - only animate after hydration to prevent mismatch
  const getAnimationProps = (delay = 0) => ({
    initial: hasMounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
    transition: hasMounted ? { duration: 0.5, delay, ease: 'easeOut' } : { duration: 0 },
  });

  // Séparer les articles featured et tous les articles pour affichage
  const { featuredPosts, allFilteredPosts } = useMemo(() => {
    let posts = searchFilteredPosts;

    // Appliquer le filtre de catégorie si sélectionné
    if (selectedCategory) {
      posts = posts.filter(post => post.category === selectedCategory);
    }

    return {
      featuredPosts: posts.filter(post => post.featured === true),
      allFilteredPosts: posts, // Tous les articles pour la pagination (featured + non-featured)
    };
  }, [searchFilteredPosts, selectedCategory]);

  // Pagination pour TOUS les articles (featured + non-featured), triés du plus récent au moins récent
  const allArticlesSorted = useMemo(() => {
    return [...allFilteredPosts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allFilteredPosts]);

  const totalPages = Math.ceil(allArticlesSorted.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return allArticlesSorted.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [allArticlesSorted, currentPage]);

  // Réinitialiser la page lors du changement de filtres
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (posts: BlogPostSummary[]) => {
    setSearchFilteredPosts(posts);
    setCurrentPage(1);
  };

  return (
    <div className="from-night via-night/95 to-night text-ivory min-h-screen bg-gradient-to-b">
      {/* Navigation Menu */}
      <NavigationMenu forceVisible />

      {/* Hero section amélioré avec parallaxes */}
      <header ref={heroRef} className="border-gold/10 relative overflow-hidden border-b pt-16">
        {/* Gradient glow effects avec parallaxe */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: glowOpacity }}
        >
          <motion.div
            className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(199,169,98,0.3),_transparent_70%)]"
            style={{ y: heroParallax }}
          />
          <motion.div
            className="absolute right-0 top-20 h-80 w-80 translate-x-1/3 rounded-full bg-[radial-gradient(circle_at_center,_rgba(245,241,230,0.2),_transparent_70%)]"
            style={{ y: secondaryParallax }}
          />
        </motion.div>

        {/* Image de fond psychonaute avec parallaxe */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('/images/psychonaute.webp')",
            backgroundPosition: 'center right',
            y: imageParallax,
          }}
        />

        {/* Gradient de fond */}
        <div className="from-gold/5 via-night/50 to-night absolute inset-0 bg-gradient-to-br"></div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <motion.div {...getAnimationProps(0)} className="text-center">
            <br />
            <motion.h1
              {...getAnimationProps(0.2)}
              className="text-gold mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl"
            >
              Voyages au Cœur de Soi
            </motion.h1>

            <motion.blockquote
              {...getAnimationProps(0.4)}
              className="text-gold/70 mx-auto mb-6 max-w-2xl text-lg italic"
            >
              <h2 className="text-2xl font-semibold">
                Carnets d'exploration à destination des psychonautes
              </h2>
            </motion.blockquote>
          </motion.div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        {/* Breadcrumb */}
        <Breadcrumb currentPage="list" />

        {/* Barre de recherche avancée */}
        <motion.div {...getAnimationProps(0.1)}>
          <SearchBar posts={allPosts} onResultsChange={handleSearchChange} />
        </motion.div>

        {/* Filtres par catégorie */}
        {categories.length > 0 && (
          <motion.div {...getAnimationProps(0.2)}>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          </motion.div>
        )}

        {/* Carrousel des articles mis en avant */}
        {featuredPosts.length > 0 && (
          <motion.div {...getAnimationProps(0.3)}>
            <FeaturedCarousel posts={featuredPosts} />
          </motion.div>
        )}

        {/* Séparateur entre featured et tous les articles */}
        {featuredPosts.length > 0 && allArticlesSorted.length > 0 && (
          <motion.div
            initial={hasMounted ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={hasMounted ? { duration: 0.4, delay: 0.4 } : { duration: 0 }}
            className="mb-12 mt-8"
          >
            <div className="flex items-center gap-3">
              <List className="text-ivory/50 h-5 w-5" />
              <h2 className="text-ivory text-2xl font-bold">Tous les articles</h2>
            </div>
            <div className="from-ivory/20 via-ivory/10 mt-4 h-px bg-gradient-to-r to-transparent" />
          </motion.div>
        )}

        {/* Liste de TOUS les articles (featured + non-featured) avec pagination */}
        {allArticlesSorted.length > 0 ? (
          <>
            <div className="space-y-6">
              {paginatedPosts.map((post, index) => (
                <BlogListItem key={post.slug} post={post} index={index} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <motion.div
            initial={hasMounted ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={hasMounted ? { duration: 0.4 } : { duration: 0 }}
            className="py-20 text-center"
          >
            <p className="text-ivory/50 text-lg">
              Aucun article dans cette catégorie pour le moment.
            </p>
          </motion.div>
        )}

        {/* Message si aucun article */}
        {allPosts.length === 0 && (
          <motion.div
            initial={hasMounted ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={hasMounted ? { duration: 0.4 } : { duration: 0 }}
            className="border-ivory/10 bg-night/50 rounded-lg border p-12 text-center backdrop-blur-sm"
          >
            <BookOpen className="text-ivory/30 mx-auto mb-4 h-12 w-12" />
            <h2 className="text-ivory mb-2 text-xl font-semibold">Aucun article disponible</h2>
            <p className="text-ivory/60">Les premiers articles seront publiés prochainement.</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-ivory/10 bg-night/80 text-ivory/50 border-t px-6 py-10 text-center text-xs sm:px-10 lg:px-16">
        © <CurrentYear /> Appréciez Votre Vie. Tous droits réservés.
      </footer>
    </div>
  );
}
