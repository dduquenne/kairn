import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-night via-night/95 to-night text-ivory">
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <FileQuestion className="mb-6 h-20 w-20 text-ivory/30" />
        <h1 className="mb-4 text-4xl font-bold text-ivory">Article non trouvé</h1>
        <p className="mb-8 text-center text-lg text-ivory/70">
          Désolé, l'article que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-medium text-night transition-all hover:bg-gold/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux articles
        </Link>
      </div>
    </div>
  );
}
