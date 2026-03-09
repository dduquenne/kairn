'use client';

export const dynamic = 'force-dynamic';

import { BlogPostForm } from '@kairn/admin';
import { useSearchParams } from 'next/navigation';

export default function NewBlogPostPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get('jobId');

  return <BlogPostForm jobId={jobId || undefined} />;
}
