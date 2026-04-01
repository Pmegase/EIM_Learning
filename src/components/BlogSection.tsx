"use client"

import React from "react";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { useBlog } from "@/contexts/BlogContext";
import BlogCard from "./BlogCard";

const BlogSection = () => {
  const { publishedPosts } = useBlog();

  const latestPosts = [...publishedPosts]
    .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
    .slice(0, 3);

  if (latestPosts.length === 0) return null;

  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
            Latest from our Blog
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {latestPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        <div className="text-center mt-10 flex items-center justify-center gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            View All Posts
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="/blog/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium py-3 px-4 border border-orange-200 rounded-lg transition-colors hover:bg-orange-50"
            title="RSS Feed"
          >
            <Rss className="h-4 w-4" />
            RSS
          </a>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
