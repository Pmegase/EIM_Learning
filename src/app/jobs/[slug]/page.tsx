"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPost } from "@/lib/api";
import { jobApplicationSchema } from "@/lib/validations";
import type { JobPosting } from "@/types/jobs";
import { JOB_TYPES, EXPERIENCE_LEVELS } from "@/types/jobs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ArrowLeft, Building, MapPin, Clock, Wifi, Briefcase, DollarSign, Users,
  Loader2, CheckCircle, ExternalLink, Send,
} from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { uploadPrivateFile } from "@/lib/storage";

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated } = useAuth();
  const supabase = createClient();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useSavedCv, setUseSavedCv] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cover_letter: "",
    resume_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const { job: data } = await apiGet<{ job: JobPosting }>(`/api/public/jobs/${slug}`);
        setJob(data);

        // Check if already applied (user-specific, needs auth)
        if (user) {
          const { data: appData } = await supabase
            .from("job_applications")
            .select("id")
            .eq("job_id", data.id)
            .eq("user_id", user.id)
            .maybeSingle();
          setAlreadyApplied(!!appData);
        }
      } catch {
        router.replace("/jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user]);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({ ...f, full_name: profile.full_name || "" }));
      if (profile.cv_url) {
        setUseSavedCv(true);
        setForm((f) => ({ ...f, resume_url: profile.cv_url! }));
      }
    }
    if (user) setForm((f) => ({ ...f, email: user.email || "" }));
  }, [profile, user]);

  const handleApply = async () => {
    setErrors({});
    const result = jobApplicationSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    if (!user || !job) {
      router.push(`/login?redirect=/jobs/${slug}`);
      return;
    }

    setApplying(true);
    try {
      await apiPost("/api/user/job-apply", {
        job_id: job.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        cover_letter: form.cover_letter,
        resume_url: form.resume_url || null,
        linkedin_url: form.linkedin_url || null,
        portfolio_url: form.portfolio_url || null,
      });
      setAlreadyApplied(true);
      setShowForm(false);
      toast({ title: "Application submitted!", description: "Your application has been sent to the employer." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Application failed";
      if (message.includes("already")) {
        toast({ title: "Already applied", variant: "destructive" });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center pt-32 pb-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }
  if (!job) return null;

  const company = job.companies;
  const deadlinePassed = job.deadline ? isPast(new Date(job.deadline)) : false;
  const canApply = !alreadyApplied && !deadlinePassed && job.status === "published";
  const typeLabel = JOB_TYPES.find((t) => t.value === job.job_type)?.label || job.job_type;
  const levelLabel = EXPERIENCE_LEVELS.find((l) => l.value === job.experience_level)?.label || job.experience_level;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <Link href="/jobs" className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-14 w-14 rounded object-contain" />
                ) : (
                  <Building className="h-8 w-8 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  {job.is_featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                </div>
                <p className="text-gray-600 text-lg">{company?.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                  {(job.location || company?.location) && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location || company?.location}{job.country ? `, ${job.country}` : ""}</span>
                  )}
                  {job.is_remote && <Badge variant="success" className="text-xs"><Wifi className="h-3 w-3 mr-1" />Remote</Badge>}
                  <Badge variant="outline">{typeLabel}</Badge>
                  <Badge variant="outline">{levelLabel}</Badge>
                  <span className="capitalize">{job.industry}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose prose-green max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: job.description }} />
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap">{job.requirements}</div>
                  </CardContent>
                </Card>
              )}

              {/* Responsibilities */}
              {job.responsibilities && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Responsibilities</CardTitle></CardHeader>
                  <CardContent>
                    <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap">{job.responsibilities}</div>
                  </CardContent>
                </Card>
              )}

              {/* Company Info */}
              {company && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building className="h-4 w-4 text-green-600" />About {company.name}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {company.description && <p className="text-sm text-gray-600">{company.description}</p>}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {company.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}{company.country ? `, ${company.country}` : ""}</span>}
                      {company.industry && <span className="capitalize">{company.industry}</span>}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  {/* Salary */}
                  {job.show_salary && job.salary_min && (
                    <div className="flex items-center gap-2 text-lg font-bold text-green-700">
                      <DollarSign className="h-5 w-5" />
                      {job.salary_currency} {job.salary_min.toLocaleString()}
                      {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : "+"}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</div>
                    {job.deadline && (
                      <div className={`flex items-center gap-2 ${deadlinePassed ? "text-red-500" : ""}`}>
                        <Clock className="h-4 w-4" />
                        {deadlinePassed ? "Deadline passed" : `Deadline: ${format(new Date(job.deadline), "MMM d, yyyy")}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2"><Users className="h-4 w-4" />{job.application_count} applicant{job.application_count !== 1 ? "s" : ""}</div>
                  </div>

                  {/* Apply */}
                  {alreadyApplied ? (
                    <div className="text-center py-3">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700">Application Submitted</p>
                      <p className="text-xs text-muted-foreground mt-1">Track your status in your dashboard.</p>
                    </div>
                  ) : showForm ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Apply for this position</h3>
                      <div className="space-y-1"><Label className="text-xs">Full Name</Label><Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />{errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}</div>
                      <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />{errors.email && <p className="text-xs text-red-500">{errors.email}</p>}</div>
                      <div className="space-y-1"><Label className="text-xs">Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                      <div className="space-y-1"><Label className="text-xs">Cover Letter</Label><Textarea rows={4} value={form.cover_letter} onChange={(e) => setForm((f) => ({ ...f, cover_letter: e.target.value }))} placeholder="Why are you a good fit for this role?" />{errors.cover_letter && <p className="text-xs text-red-500">{errors.cover_letter}</p>}</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Resume (optional)</Label>
                        {useSavedCv && profile?.cv_url ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-green-800 truncate">Using your saved CV</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { setUseSavedCv(false); setForm((f) => ({ ...f, resume_url: "" })); }}>Change</Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {profile?.cv_url && (
                              <button
                                type="button"
                                onClick={() => { setUseSavedCv(true); setForm((f) => ({ ...f, resume_url: profile.cv_url! })); }}
                                className="text-xs text-green-600 hover:text-green-800 underline"
                              >
                                Use my saved CV instead
                              </button>
                            )}
                            <div className="flex items-center gap-2">
                              <Input value={form.resume_url} onChange={(e) => setForm((f) => ({ ...f, resume_url: e.target.value }))} placeholder="Link or upload file" className="flex-1" />
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const { path, error } = await uploadPrivateFile(file, "resumes");
                                  if (path) {
                                    setForm((f) => ({ ...f, resume_url: path }));
                                    toast({ title: "Resume uploaded" });
                                  } else {
                                    toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
                                  }
                                }}
                                className="hidden"
                                id="resume-upload"
                              />
                              <label htmlFor="resume-upload">
                                <Button variant="outline" size="sm" asChild><span className="cursor-pointer">Upload</span></Button>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1"><Label className="text-xs">LinkedIn (optional)</Label><Input value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." /></div>
                      <div className="space-y-1"><Label className="text-xs">Portfolio (optional)</Label><Input value={form.portfolio_url} onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))} placeholder="https://..." /></div>
                      <div className="flex gap-2">
                        <Button onClick={handleApply} className="flex-1 bg-green-600 hover:bg-green-700" disabled={applying}>
                          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Submit</>}
                        </Button>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!canApply}
                      onClick={() => {
                        if (!isAuthenticated) router.push(`/login?redirect=/jobs/${slug}`);
                        else setShowForm(true);
                      }}
                    >
                      {deadlinePassed ? "Deadline Passed" : isAuthenticated ? "Apply Now" : "Sign In to Apply"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
