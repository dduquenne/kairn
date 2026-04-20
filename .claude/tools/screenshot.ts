#!/usr/bin/env tsx
/**
 * Helper de capture d'écran pour le skill `vision-loop`.
 *
 * Lance Chromium headless via Playwright, navigue vers l'URL, capture l'écran et écrit un PNG.
 * Conçu pour être appelé de façon ponctuelle ("one-shot") par Claude pour s'auto-observer.
 *
 * Usage :
 *   tsx .claude/tools/screenshot.ts <url> <output.png> [--viewport=desktop|mobile] [--full-page]
 *
 * Sortie : une ligne JSON sur stdout (succès ou erreur), code de sortie 0/2.
 */
import { chromium, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const [url, outPath] = args;
const viewportArg = args.find(a => a.startsWith('--viewport='))?.split('=')[1] ?? 'desktop';
const fullPage = args.includes('--full-page');

if (!url || !outPath) {
  console.error(
    'Usage: tsx .claude/tools/screenshot.ts <url> <output.png> [--viewport=desktop|mobile] [--full-page]'
  );
  process.exit(1);
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: devices['iPhone 14'].viewport,
} as const;

const viewport = VIEWPORTS[viewportArg as keyof typeof VIEWPORTS] ?? VIEWPORTS.desktop;

(async () => {
  mkdirSync(dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: outPath, fullPage });
  await browser.close();
  console.log(JSON.stringify({ ok: true, outPath, url, viewport: viewportArg, fullPage }));
})().catch((err: unknown) => {
  console.error(
    JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) })
  );
  process.exit(2);
});
