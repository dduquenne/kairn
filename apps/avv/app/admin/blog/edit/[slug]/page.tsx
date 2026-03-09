'use client';

import { BlogPostForm } from '@kairn/admin';
import { motion } from 'framer-motion';
import { Loader, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BlogPost } from '@/lib/blog';

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
          throw new Error('Article non trouvé');
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error('Error loading post:', err);
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader className="text-gold mx-auto h-12 w-12 animate-spin" />
          <p className="text-ivory/70 mt-4 text-lg">Chargement de l&apos;article...</p>
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
          <h2 className="text-ivory mt-4 text-2xl font-semibold">Article non trouvé</h2>
          <p className="text-ivory/70 mt-2">
            {error || "L'article que vous recherchez n'existe pas."}
          </p>
          <button
            onClick={() => router.push('/admin/blog')}
            className="bg-gold/20 text-gold hover:bg-gold/30 mt-6 rounded-lg px-6 py-3 font-medium transition"
          >
            Retour à la liste
          </button>
        </motion.div>
      </div>
    );
  }

  return <BlogPostForm post={post} />;
}
