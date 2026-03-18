'use client';

import React, { useEffect, useRef } from 'react';

interface GoldGlowImageProps {
  src: string;
  alt: string;
  /** Largeur CSS souhaitée (le canvas sera retina-safe) */
  width: number;
  /** Hauteur CSS souhaitée (le canvas sera retina-safe) */
  height: number;
  shadowBlur?: number;
  /** Opacité du halo doré (0–1) */
  shadowOpacity?: number;
  className?: string;
}

/**
 * Image avec effet halo doré via Canvas 2D.
 * Fallback noscript pour SEO/accessibilité.
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!mounted || !canvasRef.current) return;

      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const c = canvasRef.current;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      // Canvas en haute densité
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Effet halo doré
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.shadowColor = `rgba(212,175,55,${shadowOpacity})`;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Centrer l'image dans le cadre
      const ratio = Math.min(width / img.width, height / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      // Image nette par-dessus
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };
    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src, width, height, shadowBlur, shadowOpacity]);

  return (
    <div className={className} aria-label={alt} role="img">
      <canvas ref={canvasRef} />
      {/* Fallback noscript (JS désactivé) */}
      <noscript>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ filter: 'drop-shadow(0 0 30px gold)' }}
        />
      </noscript>
    </div>
  );
}
