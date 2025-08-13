
import React from 'react';
import { GraduationCap, Users, Briefcase, Book } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const iconMap = {
  'graduation-cap': GraduationCap,
  'users': Users,
  'briefcase': Briefcase,
  'book': Book,
};

const Services = () => {
  const { content } = useContent();
  // Define the additional links
  const additionalLinks = [
    {
      text: 'Read more',
      href: '../documents/STUDENT INTERNSHIP PROGRAM.pptx',
      download: true
    },
    {
      text: 'Read more',
      href: '../documents/MENTORSHIP PROGRAM.pptx',
      download: true
    },
    {
      text: 'Become a mentor',
      href: 'https://docs.google.com/forms/d/e/1FAIpQLScvb3Led1Qqw658OmfO8taHReaNaZ6budAMc587Zec77Fn_WQ/viewform',
      download: false
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 border-b-4 border-green-500 pb-4">
          Services
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.services.map((service) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Book;
            
            return (
              <div key={service.id} className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-4">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <IconComponent className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                {service.link && (
                  <a 
                    href={service.link} 
                    className="inline-block mt-4 text-green-600 hover:text-green-800 font-medium"
                  >
                    Read more →
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6"> {/* Reduced top margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalLinks.map((link, index) => (
              <div
                key={index}
                className={`
                  ${index === 3 ? 'lg:hidden' : ''} 
                  flex justify-center items-center
                `}
              >
                <a
                  href={link.href}
                  download={link.download}
                  target={link.download ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 w-full text-center"
                >
                  {link.text}
                </a>
              </div>
            ))}
            {/* Empty div for the 4th column on large screens */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
