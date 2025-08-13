
import React, { useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import Services from './Services';
import About from './About';
import Gallery from './Gallery';
import Contact from './Contact';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Landing = () => {
  const location = useLocation();
  useEffect(() => {
    // Handle scroll when coming from another page
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.state]);
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <About />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;
