"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Post, PostCategory } from "@/types/blog";

interface BlogContextType {
  posts: Post[];
  publishedPosts: Post[];
  categories: PostCategory[];
  loading: boolean;
  addPost: (post: Omit<Post, "id" | "created_at" | "updated_at" | "view_count">) => Promise<Post | null>;
  updatePost: (id: string, data: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPostBySlug: (slug: string) => Post | undefined;
  incrementViewCount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { posts: postsData, categories: catsData } = await apiGet<{
        posts: Post[];
        categories: PostCategory[];
      }>("/api/public/blog");
      setPosts(postsData);
      setCategories(catsData);
    } catch (err) {
      console.error("Failed to fetch blog data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const publishedPosts = posts.filter((p) => {
    if (p.status !== "published") return false;
    if (p.scheduled_at && new Date(p.scheduled_at) > new Date()) return false;
    return true;
  });

  const addPost = async (post: Omit<Post, "id" | "created_at" | "updated_at" | "view_count">) => {
    try {
      const created = await apiPost<Post>("/api/admin/blog", post);
      setPosts((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error("Error creating post:", err);
      return null;
    }
  };

  const updatePost = async (id: string, data: Partial<Post>) => {
    try {
      await apiPut(`/api/admin/blog/${id}`, data);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const deletePost = async (id: string) => {
    try {
      await apiDelete(`/api/admin/blog/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const getPostBySlug = (slug: string) => {
    return publishedPosts.find((p) => p.slug === slug);
  };

  const incrementViewCount = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      // The blog/[slug] API route handles the increment server-side;
      // here we just optimistically update local state.
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, view_count: p.view_count + 1 } : p)));
    }
  };

  const refresh = fetchPosts;

  return (
    <BlogContext.Provider
      value={{
        posts,
        publishedPosts,
        categories,
        loading,
        addPost,
        updatePost,
        deletePost,
        getPostBySlug,
        incrementViewCount,
        refresh,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) throw new Error("useBlog must be used within a BlogProvider");
  return context;
};

// Re-export Post type for backward compatibility
export type { Post as BlogPost } from "@/types/blog";
