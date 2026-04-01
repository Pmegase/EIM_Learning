"use client"

import React, { useState, useEffect } from "react";
import { useContent } from "@/contexts/ContentContext";

const Hero = () => {
  const { content } = useContent();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % content.heroTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [content.heroTexts.length]);

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/uploads/hero-bg.png')`,
      }}
    >
      <div className="text-center text-white px-4 max-w-4xl mt-20 md:mt-40">
        <div className="min-h-[80px] md:min-h-[100px] flex items-center justify-center mt-20 sm:mt-40 md:mt-60 lg:mt-80">
          <h1
            className="text-xl sm:text-2xl md:text-4xl font-bold transition-all duration-1000 ease-in-out"
            key={currentTextIndex}
          >
            {content.heroTexts[currentTextIndex]}
          </h1>
        </div>
      </div>
    </section>
  );
};

export default Hero;
