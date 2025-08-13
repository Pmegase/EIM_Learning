
import React from 'react';
import { Linkedin } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const About = () => {
  const { content } = useContent();

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Vision</h3>
            <p className="text-gray-600 leading-relaxed">{content.vision}</p>
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">About us</h3>
            <p className="text-gray-600 leading-relaxed">{content.aboutUs}</p>
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Mission</h3>
            <p className="text-gray-600 leading-relaxed">{content.mission}</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-bold mb-12 text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
            Management
          </h2>
          
          <div className="flex justify-center">
            {content.teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-bold mb-4 text-gray-800">{member.name}</h3>
                {member.linkedin && (
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
