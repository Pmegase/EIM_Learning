import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { navigateToSection } = useNavigation();

  const goToFAQ = () => {
    navigate('/faq');
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full bg-white shadow-md z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/lovable-uploads/4331cb81-49ad-4f32-98e2-0dcdd8050aa9.png"
              alt="EIM Consultancy"
              className="h-12 w-auto cursor-pointer"
              onClick={() => navigateToSection('home')}
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => navigateToSection('home')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigateToSection('services')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => navigateToSection('about')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigateToSection('gallery')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Gallery
            </button>
            <button
              onClick={() => navigateToSection('contact')}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              Contact
            </button>
           
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => navigateToSection('home')}
                className="text-gray-700 hover:text-green-600 transition-colors text-left"
              >
                Home
              </button>
              <button
                onClick={() => navigateToSection('services')}
                className="text-gray-700 hover:text-green-600 transition-colors text-left"
              >
                Services
              </button>
              <button
                onClick={() => navigateToSection('about')}
                className="text-gray-700 hover:text-green-600 transition-colors text-left"
              >
                About
              </button>
              <button
                onClick={() => navigateToSection('gallery')}
                className="text-gray-700 hover:text-green-600 transition-colors text-left"
              >
                Gallery
              </button>
              <button
                onClick={() => navigateToSection('contact')}
                className="text-gray-700 hover:text-green-600 transition-colors text-left"
              >
                Contact
              </button>
             
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;