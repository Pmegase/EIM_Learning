import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const { navigateToSection } = useNavigation();
  const navigate = useNavigate();

  const goToFAQ = () => {
    navigate('/faq');
  };

  return (
    <footer className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center border-b border-gray-200 pb-8 mb-8">
          <button
            onClick={() => navigateToSection('home')}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navigateToSection('services')}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            Services
          </button>
          <button
            onClick={() => navigateToSection('about')}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            About
          </button>
          <button
            onClick={() => navigateToSection('gallery')}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            Gallery
          </button>
          <button
            onClick={() => navigateToSection('contact')}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            Contact
          </button>
          <button
            onClick={goToFAQ}
            className="mx-4 my-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            FAQ
          </button>
        </div>

        <p className="text-center text-gray-600">
          © 2024 EIM Consultancy. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;