import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const Gallery = () => {
  const { content } = useContent();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        (prev + 1) % content.carouselImages.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [content.carouselImages.length]);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? content.carouselImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      (prev + 1) % content.carouselImages.length
    );
  };

  if (!content.carouselImages.length) {
    return null;
  }

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
          Gallery
        </h2>

        <div className="relative max-w-4xl mx-auto">
          {/* Changed to object-contain and added bg-white */}
          <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg shadow-lg bg-white">
            {content.carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-contain"  // Changed from object-cover
                />
              </div>
            ))}
          </div>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="flex justify-center mt-4 space-x-2">
            {content.carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex ? 'bg-green-600' : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;