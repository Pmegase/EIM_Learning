"use client"

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Tag, Folder } from "lucide-react";
import type { BlogPost } from "@/contexts/BlogContext";

interface BlogCardProps {
  post: BlogPost;
  compact?: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, compact = false }) => {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className={`relative ${compact ? "h-40" : "h-52"} overflow-hidden`}>
          <Image
            src={post.image_url || "/uploads/gallery-1.png"}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Category badge over image */}
          {post.category_name && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-2.5 py-1 rounded-full shadow">
                <Folder className="h-3 w-3" />
                {post.category_name}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col flex-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className={`font-bold text-gray-800 group-hover:text-green-600 transition-colors mb-2 ${compact ? "text-base" : "text-lg"}`}>
            {post.title}
          </h3>

          {/* Excerpt */}
          {!compact && (
            <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author_name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
