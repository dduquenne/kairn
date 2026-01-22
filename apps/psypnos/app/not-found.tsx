import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-night via-night/95 to-night px-6 text-center">
      <h1 className="mb-4 text-6xl font-bold text-gold">404</h1>
      <h2 className="mb-4 text-3xl font-semibold text-ivory">Page non trouvée</h2>
      <p className="mb-8 max-w-md text-lg text-ivory/80">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-gold/20 px-8 py-3 font-medium text-gold transition-all hover:bg-gold/30"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
