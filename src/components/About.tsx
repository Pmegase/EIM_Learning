"use client"

import React from "react";
import { ExternalLink, Eye, Target, Building } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import Image from "next/image";

const About = () => {
  const { content } = useContent();

  return (
    <section id="about" className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
            About Us
          </h2>
        </div>

        {/* About Text */}
        <div className="max-w-4xl mx-auto mb-10 md:mb-16">
          <div className="relative bg-white rounded-2xl shadow-md p-5 sm:p-8 md:p-10 border-l-4 border-green-500">
            <Building className="absolute top-6 right-6 h-10 w-10 text-green-100 hidden md:block" />
            <p className="text-gray-600 leading-relaxed text-lg">{content.aboutUs}</p>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-12 md:mb-20 max-w-5xl mx-auto">
          {/* Vision */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="bg-green-600 px-6 py-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Our Vision</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">{content.vision}</p>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="bg-green-700 px-6 py-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Our Mission</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed">{content.mission}</p>
            </div>
          </div>
        </div>

        {/* Management Team */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
            Management
          </h2>
          <p className="text-gray-500 mt-4 mb-12 max-w-xl mx-auto">
            Meet the leadership driving EIM&apos;s vision of bridging the gap between employers and students across Africa.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
            {content.teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden w-full sm:max-w-xs group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* LinkedIn overlay */}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 h-9 w-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </a>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-green-600 font-medium mt-1">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
