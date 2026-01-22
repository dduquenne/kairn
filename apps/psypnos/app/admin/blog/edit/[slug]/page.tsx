"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader, AlertCircle } from "lucide-react";
import { BlogPost } from "@/lib/blog";
import { BlogPostForm } from "../../_components/BlogPostForm";

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/blog/posts/${slug}?includeUnpublished=true`);

        if (!response.ok) {
          throw new Error("Article non trouvé");
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error("Error loading post:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'article");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader className="mx-auto h-12 w-12 animate-spin text-gold" />
          <p className="mt-4 text-lg text-ivory/70">Chargement de l&apos;article...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
          <h2 className="mt-4 text-2xl font-semibold text-ivory">
            Article non trouvé
          </h2>
          <p className="mt-2 text-ivory/70">
            {error || "L'article que vous recherchez n'existe pas."}
          </p>
          <button
            onClick={() => router.push("/admin/blog")}
            className="mt-6 rounded-lg bg-gold/20 px-6 py-3 font-medium text-gold transition hover:bg-gold/30"
          >
            Retour à la liste
          </button>
        </motion.div>
      </div>
    );
  }

  return <BlogPostForm post={post} />;
}
