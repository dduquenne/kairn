/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;   // dimensions CSS souhaitées
  height: number;  // (le canvas sera “retina-safe”)
  shadowBlur?: number;
  shadowOpacity?: number;  // 0–1
  className?: string;
};

export default function GoldGlowImage({
  src,
  alt,
  width,
  height,
  shadowBlur = 30,
  shadowOpacity = 0.9,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous"; // safe si l’image vient d’un autre domaine (sinon inoffensif)
    img.onload = () => {
      if (!mounted || !canvasRef.current) return;

      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const c = canvasRef.current;
      const ctx = c.getContext("2d")!;

      // Canvas en haute densité
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Effet halo doré
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.shadowColor = `rgba(212,175,55,${shadowOpacity})`; // « or » (#D4AF37)
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // On dessine l'image (l’ombre suit l’alpha)
      // On centre l’image dans le cadre demandé
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

  // Fallback SEO-accessible via aria-label
  return (
    <div className={className} aria-label={alt} role="img">
      <canvas ref={canvasRef} />
      {/* Fallback noscript (en cas de JS désactivé) */}
      <noscript>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ filter: "drop-shadow(0 0 30px gold)" }}
        />
      </noscript>
    </div>
  );
}
