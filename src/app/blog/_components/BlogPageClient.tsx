"use client"

import React, { useState, useMemo } from "react";
import { Search, Tag, Folder } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { Input } from "@/components/ui/input";
import { useBlog } from "@/contexts/BlogContext";

export default function BlogPageClient() {
  const { publishedPosts } = useBlog();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    publishedPosts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [publishedPosts]);

  // Get all unique categories
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    publishedPosts.forEach((post) => { if (post.category_name) cats.add(post.category_name); });
    return Array.from(cats).sort();
  }, [publishedPosts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let result = [...publishedPosts].sort(
      (a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          (post.category_name && post.category_name.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((post) => post.category_name === selectedCategory);
    }

    if (selectedTag) {
      result = result.filter((post) => post.tags.includes(selectedTag));
    }

    return result;
  }, [publishedPosts, searchQuery, selectedTag, selectedCategory]);

  return (
      <div className="min-h-screen">
        <Header />

        <section className="pt-24 pb-20 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Page Title */}
            <div className="text-center mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">Blog</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Insights, tips, and stories about mentorship, career development, and professional growth in Africa.
              </p>
            </div>

            {/* Search */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            {/* Categories */}
            {allCategories.length > 0 && (
              <div className="max-w-4xl mx-auto mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                  <Folder className="h-3.5 w-3.5" /> Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    All Categories
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat ? null : cat);
                        setSelectedTag(null);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-gray-800 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <Folder className="h-3 w-3" />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="max-w-4xl mx-auto mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Tags
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !selectedTag
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All Tags
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? null : tag);
                      setSelectedCategory(null);
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === tag
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <p className="max-w-6xl mx-auto text-sm text-gray-500 mb-4">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""} found
            </p>

            {/* Posts Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
                {filteredPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No posts found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
  );
}
