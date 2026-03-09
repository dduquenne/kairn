import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="from-night via-night/95 to-night flex min-h-screen flex-col items-center justify-center bg-gradient-to-b px-6 text-center">
      <h1 className="font-display text-gold-accessible mb-4 text-6xl font-bold">404</h1>
      <h2 className="font-display text-ivory mb-4 text-3xl font-semibold">Page non trouvée</h2>
      <p className="text-ivory/80 mb-8 max-w-md text-lg">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="bg-gold/20 text-gold hover:bg-gold/30 inline-block rounded-lg px-8 py-3 font-medium transition-all"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
