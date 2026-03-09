"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Tag } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface BlogArticleHeroProps {
  image: string;
  title: string;
  category: string;
}

export function BlogArticleHero({ image, title, category }: BlogArticleHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Effets parallaxes pour l'image
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const imageParallax = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.4, 0.8]);

  return (
    <div ref={heroRef} className="border-b border-gold/10 bg-night/50 overflow-hidden">
      <div className="relative h-64 sm:h-80 lg:h-96 w-full">
        {/* Image avec parallaxe */}
        <motion.div
          className="absolute inset-0"
          style={{ y: imageParallax }}
        >
          <Image
            src={image}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
            priority
          />
        </motion.div>

        {/* Overlay avec gradient et titre */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/60 to-transparent"
          style={{ opacity: overlayOpacity }}
        />

        <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-16">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/30 px-3 py-1 text-sm font-medium text-gold backdrop-blur-sm">
                <Tag className="h-3 w-3" />
                {category}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl font-bold text-ivory drop-shadow-lg sm:text-4xl lg:text-5xl"
            >
              {title}
            </motion.h1>
          </div>
        </div>
      </div>
    </div>
  );
}
