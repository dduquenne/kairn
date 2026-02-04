"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";

import { BlogPostForm } from "../_components/BlogPostForm";

export default function NewBlogPostPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams?.get("jobId");

  return <BlogPostForm jobId={jobId || undefined} />;
}
