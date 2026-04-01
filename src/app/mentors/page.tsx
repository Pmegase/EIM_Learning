"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { MentorApplication } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Search, Users, Briefcase, Award, Loader2, User } from "lucide-react";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const { mentors: data } = await apiGet<{ mentors: MentorApplication[] }>("/api/public/mentors");
        setMentors(data);
      } catch (err) {
        console.error("Failed to fetch mentors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  const filtered = mentors.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.organization.toLowerCase().includes(q) ||
      m.general_competencies.toLowerCase().includes(q) ||
      m.technical_competencies.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">
        <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Our Mentors</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Connect with experienced professionals who are ready to guide you in your career journey.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search mentors by name, skills, organization..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No mentors found</h3>
              <p className="text-muted-foreground mt-1">
                {search ? "Try adjusting your search." : "Check back soon for available mentors!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((mentor) => (
                <Link key={mentor.id} href={`/mentors/${mentor.user_id}`}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {mentor.profiles?.avatar_url ? (
                            <img src={mentor.profiles.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                          ) : (
                            <User className="h-7 w-7 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900">{mentor.title} {mentor.full_name}</h3>
                          <p className="text-sm text-gray-500 truncate">{mentor.organization}</p>
                          <p className="text-xs text-gray-400">{mentor.division}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Award className="h-3 w-3" /> Key Competencies</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{mentor.general_competencies}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Briefcase className="h-3 w-3" /> Technical Skills</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{mentor.technical_competencies}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Badge variant="success" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Accepts {mentor.max_mentees} mentee{mentor.max_mentees > 1 ? "s" : ""}
                        </Badge>
                        <span className="text-xs text-green-600 font-medium">View Profile &rarr;</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
