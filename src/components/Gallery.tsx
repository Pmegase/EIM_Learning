"use client"

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import Image from "next/image";

const Gallery = () => {
  const { content } = useContent();
  const images = content.carouselImages;
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    if (paused || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, images.length]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setCurrent((prev) => (prev + dir + images.length) % images.length);
    },
    [images.length]
  );

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((prev) => (prev! - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setLightbox((prev) => (prev! + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

  if (!images.length) return null;

  return (
    <>
      <section id="gallery" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
              Gallery
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Moments from our workshops, mentorship sessions, and corporate events.
            </p>
          </div>

          {/* Main Carousel */}
          <div
            className="relative max-w-5xl mx-auto"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative h-56 sm:h-80 md:h-[480px] overflow-hidden rounded-2xl shadow-lg bg-gray-900">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === current
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105 pointer-events-none"
                  }`}
                >
                  {/* Blurred background fill — removes ugly gaps */}
                  <Image
                    src={image}
                    alt=""
                    fill
                    className="object-cover scale-110 blur-2xl opacity-60"
                    aria-hidden="true"
                  />
                  {/* Sharp foreground — fully visible, never cropped */}
                  <Image
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-contain relative z-[1]"
                  />
                </div>
              ))}

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Counter + Zoom */}
              <div className="absolute bottom-4 left-5 flex items-center gap-3">
                <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                  {current + 1} / {images.length}
                </span>
                <button
                  onClick={() => setLightbox(current)}
                  className="text-white bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-sm transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => go(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Dots */}
            {images.length > 1 && (
              <div className="flex justify-center mt-5 gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === current
                        ? "w-8 h-2.5 bg-green-600"
                        : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          {images.length > 1 && (
            <div className="max-w-5xl mx-auto mt-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                      index === current
                        ? "ring-2 ring-green-600 ring-offset-2 opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-5 text-white/70 text-sm font-medium">
            {lightbox + 1} / {images.length}
          </span>

          {/* Image */}
          <div
            className="relative w-[90vw] h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]}
              alt={`Gallery image ${lightbox + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Nav */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) => (prev! - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((prev) => (prev! + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Gallery;
