"use client"

import React from "react";
import { GraduationCap, Users, Briefcase, Book, ArrowRight } from "lucide-react";
import { useContent } from "@/contexts/ContentContext";
import Link from "next/link";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "graduation-cap": GraduationCap,
  users: Users,
  briefcase: Briefcase,
  book: Book,
};

const cardAccents = [
  "from-green-500 to-green-600",
  "from-green-600 to-green-700",
  "from-green-700 to-green-800",
  "from-green-500 to-emerald-600",
];

const Services = () => {
  const { content } = useContent();

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
            Our Services
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Bridging the gap between employers and students through mentorship, training, and professional development.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {content.services.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Book;
            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100"
              >
                {/* Top accent bar */}
                <div className={`h-1.5 bg-gradient-to-r ${cardAccents[index % cardAccents.length]}`} />

                <div className="p-6">
                  {/* Icon */}
                  <div className="h-14 w-14 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mb-5 transition-colors">
                    <IconComponent className="h-7 w-7 text-green-600" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {/* Link */}
                  {service.link && (
                    <a
                      href={service.link}
                      className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Row */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/documents/STUDENT INTERNSHIP PROGRAM.pptx"
            download
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            Internship Program
          </a>
          <Link
            href="/mentors"
            className="inline-flex items-center gap-2 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <Users className="h-4 w-4" />
            Browse Mentors
          </Link>
          <Link
            href="/mentor-application"
            className="inline-flex items-center gap-2 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Become a Mentor
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
