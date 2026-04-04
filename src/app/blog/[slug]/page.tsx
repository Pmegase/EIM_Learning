import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BlogPostClient from "../_components/BlogPostClient";
import JsonLd from "@/components/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.eimconsultld.com";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .single();

  if (!post) {
    return { title: "Post Not Found | EIM Consultancy" };
  }

  return {
    title: `${post.title} | EIM Consultancy`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author_name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      tags: post.tags,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 630, alt: post.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt, author_name, published_at, image_url, tags, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .single();

  return (
    <>
      {post && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Person", name: post.author_name },
            datePublished: post.published_at,
            image: post.image_url || undefined,
            url: `${SITE_URL}/blog/${post.slug}`,
            publisher: {
              "@type": "Organization",
              name: "EIM Learning and Development Consult",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/uploads/logo.png` },
            },
            keywords: post.tags?.join(", "),
          }}
        />
      )}
      <BlogPostClient slug={slug} />
    </>
  );
}
