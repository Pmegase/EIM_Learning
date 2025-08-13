
import React, { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';

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
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/lovable-uploads/af7506d4-417a-4b90-95ab-b5e5d4d80b6a.png')`
      }}
    >
      <div className="text-center text-white px-4 max-w-4xl mt-40">
        
        
        <div className="min-h-[100px] flex items-center justify-center mt-80 ">
          <h1 
            className="text-2xl md:text-4xl font-bold transition-all duration-1000 ease-in-out "
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
