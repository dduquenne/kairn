'use client';

import Image from 'next/image';

interface GoldGlowImageProps {
  src: string;
  alt: string;
  /** Largeur CSS souhaitée */
  width: number;
  /** Hauteur CSS souhaitée */
  height: number;
  shadowBlur?: number;
  /** Opacité du halo doré (0–1) */
  shadowOpacity?: number;
  className?: string;
}

/**
 * Image avec effet halo doré via CSS drop-shadow.
 * Utilise Next.js Image pour optimisation automatique.
 */
export default function GoldGlowImage({
  src,
  alt,
  width,
  height,
  shadowBlur = 30,
  shadowOpacity = 0.9,
  className,
}: GoldGlowImageProps) {
  return (
    <div
      className={className}
      aria-label={alt}
      role="img"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        filter: `drop-shadow(0 0 ${shadowBlur}px rgba(212,175,55,${shadowOpacity}))`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-cover"
        style={{ borderRadius: 'inherit' }}
      />
    </div>
  );
}
