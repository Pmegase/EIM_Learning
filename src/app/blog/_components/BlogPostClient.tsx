"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Tag, Folder, Share2, Link2, Check } from "lucide-react";

// Inline SVG icons for social platforms not in lucide-react v1.7.0
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { useBlog } from "@/contexts/BlogContext";

interface BlogPostClientProps {
  slug: string;
}

function renderContent(content: string) {
  // Check if content looks like HTML (from TipTap)
  if (content.trim().startsWith("<")) {
    return (
      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-green-600 prose-strong:text-gray-800"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Legacy plain text rendering
  const paragraphs = content.split("\n\n");
  return (
    <div className="prose prose-lg max-w-none">
      {paragraphs.map((paragraph, idx) => {
        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
          return (
            <h2 key={idx} className="text-2xl font-bold text-gray-800 mt-8 mb-4">
              {paragraph.replace(/\*\*/g, "")}
            </h2>
          );
        }
        if (paragraph.includes("\n")) {
          const lines = paragraph.split("\n");
          const isList = lines.some((l) => /^\d+\./.test(l.trim()));
          if (isList) {
            return (
              <div key={idx} className="my-4">
                {lines.map((line, li) => {
                  const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—-]\s*(.*)/);
                  if (match) {
                    return (
                      <div key={li} className="mb-3 pl-4">
                        <p className="text-gray-800">
                          <strong className="text-green-700">{match[1]}</strong> — {match[2]}
                        </p>
                      </div>
                    );
                  }
                  const simpleMatch = line.match(/^[-•]\s+(.*)/);
                  if (simpleMatch) {
                    return (
                      <div key={li} className="mb-2 pl-4 flex gap-2">
                        <span className="text-green-600">•</span>
                        <p className="text-gray-700">{simpleMatch[1]}</p>
                      </div>
                    );
                  }
                  if (line.trim()) {
                    return <p key={li} className="text-gray-700 mb-2">{line}</p>;
                  }
                  return null;
                })}
              </div>
            );
          }
        }
        return (
          <p key={idx} className="text-gray-700 leading-relaxed mb-4">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const { getPostBySlug, publishedPosts } = useBlog();
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const post = getPostBySlug(slug);

  // Related posts: same category or shared tags, excluding current post
  const relatedPosts = post
    ? publishedPosts
        .filter((p) => p.id !== post.id)
        .map((p) => ({
          post: p,
          score:
            (p.category_name === post.category_name ? 3 : 0) +
            p.tags.filter((t) => post.tags.includes(t)).length,
        }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((r) => r.post)
    : [];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: pageUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  if (!post) {
    return (
        <div className="min-h-screen">
          <Header />
          <div className="pt-24 pb-20 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Post Not Found</h1>
              <p className="text-gray-600 mb-8">The blog post you are looking for does not exist.</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </div>
          </div>
          <Footer />
        </div>
    );
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(pageUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.author_name,
    },
    datePublished: post.published_at || post.created_at,
    image: post.image_url || "/uploads/gallery-1.png",
    publisher: {
      "@type": "Organization",
      name: "EIM Consultancy",
      logo: {
        "@type": "ImageObject",
        url: "/uploads/logo.png",
      },
    },
    keywords: post.tags.join(", "),
    articleSection: post.category_name,
    url: pageUrl,
  };

  return (
      <div className="min-h-screen">
        <Header />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <article className="pt-24 pb-20">
          {/* Cover Image */}
          <div className="relative h-64 md:h-96 w-full">
            <Image
              src={post.image_url || "/uploads/gallery-1.png"}
              alt={post.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            {/* Category overlay */}
            {post.category_name && (
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                  <Folder className="h-4 w-4" />
                  {post.category_name}
                </span>
              </div>
            )}
          </div>

          <div className="container mx-auto px-4 max-w-3xl">
            {/* Back Button */}
            <div className="py-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{post.title}</h1>

            {/* Meta + Share */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author_name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Share2 className="h-4 w-4" /> Share:
                </span>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors"
                  title="Share on X (Twitter)"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">X</span>
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-full transition-colors"
                  title="Share on LinkedIn"
                >
                  <LinkedInIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">More</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {renderContent(post.content)}

            {/* Bottom Share */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Found this helpful? Share it:</p>
              <div className="flex items-center gap-2">
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  <XIcon className="h-4 w-4" /> Share on X
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
                >
                  <LinkedInIcon className="h-4 w-4" /> Share on LinkedIn
                </a>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
                  {copied ? "Link copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="pb-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {relatedPosts.map((related) => (
                  <BlogCard key={related.id} post={related} compact />
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
  );
}
