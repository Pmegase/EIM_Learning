"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { JobPosting } from "@/types/jobs";
import { JOB_TYPES, EXPERIENCE_LEVELS, JOB_INDUSTRIES } from "@/types/jobs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Search, Briefcase, MapPin, Clock, Building, DollarSign, Loader2, Wifi,
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { jobs: data } = await apiGet<{ jobs: JobPosting[] }>("/api/public/jobs");
        setJobs(data);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filtered = jobs.filter((j) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !j.title.toLowerCase().includes(q) &&
        !(j.companies?.name || "").toLowerCase().includes(q) &&
        !(j.location || "").toLowerCase().includes(q) &&
        !j.industry.toLowerCase().includes(q)
      )
        return false;
    }
    if (typeFilter !== "all" && j.job_type !== typeFilter) return false;
    if (levelFilter !== "all" && j.experience_level !== levelFilter) return false;
    if (industryFilter !== "all" && j.industry !== industryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">
        <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Job Board</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Find internships, full-time roles, and career opportunities from our corporate partners.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search jobs, companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All Types</option>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All Levels</option>
                {EXPERIENCE_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All Industries</option>
                {JOB_INDUSTRIES.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No jobs found</h3>
              <p className="text-muted-foreground mt-1">
                {search || typeFilter !== "all" ? "Try adjusting your filters." : "Check back soon for new opportunities!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => (
                <Link key={job.id} href={`/jobs/${job.slug}`}>
                  <Card className={`hover:shadow-lg transition-shadow ${job.is_featured ? "border-green-200 border-2" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {job.companies?.logo_url ? (
                              <img src={job.companies.logo_url} alt="" className="h-10 w-10 rounded object-contain" />
                            ) : (
                              <Building className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                              {job.is_featured && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>}
                            </div>
                            <p className="text-sm text-gray-600">{job.companies?.name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                              {(job.location || job.companies?.location) && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location || job.companies?.location}</span>
                              )}
                              {job.is_remote && <span className="flex items-center gap-1"><Wifi className="h-3 w-3" />Remote</span>}
                              <Badge variant="outline" className="text-xs capitalize">{job.job_type.replace("-", " ")}</Badge>
                              <Badge variant="outline" className="text-xs capitalize">{job.experience_level} Level</Badge>
                              {job.show_salary && job.salary_min && (
                                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />
                                  {job.salary_currency} {job.salary_min.toLocaleString()}
                                  {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                          {job.deadline && (
                            <span className={`text-xs ${isPast(new Date(job.deadline)) ? "text-red-500" : "text-gray-500"}`}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {isPast(new Date(job.deadline)) ? "Closed" : `Deadline: ${new Date(job.deadline).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
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
