"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { JobPosting, JobApplication, Company, JobStatus, ApplicationStatus } from "@/types/jobs";
import { JOB_TYPES, EXPERIENCE_LEVELS, JOB_INDUSTRIES, APPLICATION_STATUSES } from "@/types/jobs";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Loader2, Plus, Save, Trash2, Pencil, Eye, ArrowLeft, Search,
  LayoutDashboard, LogOut, Building, Briefcase, Users, CheckCircle, XCircle,
} from "lucide-react";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), { ssr: false });

function generateSlug(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

type View = "jobs" | "job-form" | "applications" | "companies";

export default function AdminJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, role, isLoading: authLoading, logout } = useAuth();

  const [view, setView] = useState<View>("jobs");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [selectedJobForApps, setSelectedJobForApps] = useState<JobPosting | null>(null);
  const [search, setSearch] = useState("");

  // Job form
  const [jf, setJf] = useState({
    company_id: "", title: "", slug: "", description: "", requirements: "", responsibilities: "",
    job_type: "full-time", experience_level: "entry", industry: "other",
    location: "", country: "", is_remote: false,
    salary_min: "", salary_max: "", salary_currency: "GHS", show_salary: false,
    deadline: "", status: "draft" as JobStatus, is_featured: false,
  });

  // Company form
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [cf, setCf] = useState({
    name: "", industry: "other", website: "", description: "", contact_email: "", contact_phone: "",
    location: "", country: "", employee_count: "", is_verified: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { jobs: j, companies: c } = await apiGet<{ jobs: JobPosting[]; companies: Company[] }>("/api/admin/jobs");
      setJobs(j);
      setCompanies(c);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated && role === "admin") fetchAll(); }, [isAuthenticated, role, fetchAll]);
  useEffect(() => { if (!authLoading && (!isAuthenticated || role !== "admin")) router.replace("/login"); }, [authLoading, isAuthenticated, role, router]);

  const resetJobForm = () => {
    setJf({ company_id: "", title: "", slug: "", description: "", requirements: "", responsibilities: "", job_type: "full-time", experience_level: "entry", industry: "other", location: "", country: "", is_remote: false, salary_min: "", salary_max: "", salary_currency: "GHS", show_salary: false, deadline: "", status: "draft", is_featured: false });
    setEditingJob(null);
  };

  const openEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJf({
      company_id: job.company_id, title: job.title, slug: job.slug, description: job.description,
      requirements: job.requirements, responsibilities: job.responsibilities,
      job_type: job.job_type, experience_level: job.experience_level, industry: job.industry,
      location: job.location || "", country: job.country || "", is_remote: job.is_remote,
      salary_min: job.salary_min?.toString() || "", salary_max: job.salary_max?.toString() || "",
      salary_currency: job.salary_currency, show_salary: job.show_salary,
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : "",
      status: job.status, is_featured: job.is_featured,
    });
    setView("job-form");
  };

  const handleSaveJob = async () => {
    if (!jf.title || !jf.company_id) { toast({ title: "Title and company required", variant: "destructive" }); return; }
    setSaving(true);
    const data = {
      company_id: jf.company_id, posted_by: user!.id, title: jf.title, slug: jf.slug || generateSlug(jf.title),
      description: jf.description, requirements: jf.requirements, responsibilities: jf.responsibilities,
      job_type: jf.job_type, experience_level: jf.experience_level, industry: jf.industry,
      location: jf.location || null, country: jf.country || null, is_remote: jf.is_remote,
      salary_min: jf.salary_min ? parseFloat(jf.salary_min) : null,
      salary_max: jf.salary_max ? parseFloat(jf.salary_max) : null,
      salary_currency: jf.salary_currency, show_salary: jf.show_salary,
      deadline: jf.deadline ? new Date(jf.deadline).toISOString() : null,
      status: jf.status, is_featured: jf.is_featured,
    };
    try {
      if (editingJob) {
        await apiPut(`/api/admin/jobs/${editingJob.id}`, data);
      } else {
        await apiPost("/api/admin/jobs", data);
      }
      toast({ title: editingJob ? "Job updated" : "Job created" });
      resetJobForm(); setView("jobs"); fetchAll();
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save job", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await apiDelete(`/api/admin/jobs/${id}`);
      toast({ title: "Job deleted" });
      fetchAll();
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to delete job", variant: "destructive" });
    }
  };

  const handleSaveCompany = async () => {
    if (!cf.name) { toast({ title: "Company name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiPost("/api/admin/companies", {
        ...cf, user_id: user!.id, slug: generateSlug(cf.name),
        website: cf.website || null, contact_phone: cf.contact_phone || null,
        employee_count: cf.employee_count || null,
      });
      toast({ title: "Company added" });
      setCf({ name: "", industry: "other", website: "", description: "", contact_email: "", contact_phone: "", location: "", country: "", employee_count: "", is_verified: true });
      setShowCompanyForm(false);
      fetchAll();
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save company", variant: "destructive" });
    }
    setSaving(false);
  };

  const openApplications = async (job: JobPosting) => {
    setSelectedJobForApps(job);
    try {
      const { applications: apps } = await apiGet<{ applications: JobApplication[] }>(`/api/admin/jobs/${job.id}/applications`);
      setApplications(apps);
    } catch {
      setApplications([]);
    }
    setView("applications");
  };

  const updateAppStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await apiPut(`/api/admin/jobs/${selectedJobForApps!.id}/applications`, { applicationId: appId, status });
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update application", variant: "destructive" });
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Job Management</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Button>
              <Button onClick={() => router.push("/admin/mentorship")} variant="outline" size="sm"><Users className="h-4 w-4 mr-1" />Mentorships</Button>
              <Button onClick={() => router.push("/admin/users")} variant="outline" size="sm"><Users className="h-4 w-4 mr-1" />Users</Button>
              <Button onClick={logout} variant="outline" size="sm"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* JOBS LIST */}
        {view === "jobs" && (
          <Tabs defaultValue="jobs">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="jobs">Job Postings ({jobs.length})</TabsTrigger>
              <TabsTrigger value="companies">Companies ({companies.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => { resetJobForm(); setView("job-form"); }} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" />New Job</Button>
              </div>
              {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div> : (
                <div className="space-y-3">
                  {jobs.filter((j) => !search || j.title.toLowerCase().includes(search.toLowerCase())).map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{job.title}</h3>
                            <Badge variant={job.status === "published" ? "success" : job.status === "closed" ? "destructive" : "warning"} className="text-xs">{job.status}</Badge>
                            {job.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">{(job.companies as unknown as Company)?.name} | {job.application_count} applicant{job.application_count !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => openApplications(job)} title="Applications"><Users className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/jobs/${job.slug}`, "_blank")}><Eye className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => openEditJob(job)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteJob(job.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowCompanyForm(!showCompanyForm)} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" />{showCompanyForm ? "Cancel" : "Add Company"}</Button>
              </div>
              {showCompanyForm && (
                <Card><CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Company Name</Label><Input value={cf.name} onChange={(e) => setCf((f) => ({ ...f, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Industry</Label><select value={cf.industry} onChange={(e) => setCf((f) => ({ ...f, industry: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">{JOB_INDUSTRIES.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}</select></div>
                    <div className="space-y-1"><Label>Contact Email</Label><Input value={cf.contact_email} onChange={(e) => setCf((f) => ({ ...f, contact_email: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Website</Label><Input value={cf.website} onChange={(e) => setCf((f) => ({ ...f, website: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Location</Label><Input value={cf.location} onChange={(e) => setCf((f) => ({ ...f, location: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Country</Label><Input value={cf.country} onChange={(e) => setCf((f) => ({ ...f, country: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={cf.description} onChange={(e) => setCf((f) => ({ ...f, description: e.target.value }))} /></div>
                  <Button onClick={handleSaveCompany} className="bg-green-600 hover:bg-green-700" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}Save Company</Button>
                </CardContent></Card>
              )}
              <div className="space-y-3">
                {companies.map((c) => (
                  <Card key={c.id}><CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="text-sm text-gray-500">{c.industry} | {c.location}{c.country ? `, ${c.country}` : ""}</p>
                      {c.tagline && <p className="text-xs text-muted-foreground mt-0.5">{c.tagline}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {(c as any).status === "approved" || c.is_verified ? (
                        <Badge variant="success" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
                      ) : (c as any).status === "rejected" ? (
                        <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                      ) : (
                        <>
                          <Badge variant="warning" className="text-xs">Pending</Badge>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => {
                            try {
                              await apiPut(`/api/admin/companies/${c.id}`, { status: "approved" });
                              setCompanies((prev) => prev.map((co) => co.id === c.id ? { ...co, is_verified: true, status: "approved" } as any : co));
                              toast({ title: `${c.name} approved` });
                            } catch { toast({ title: "Failed to approve", variant: "destructive" }); }
                          }}><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            try {
                              await apiPut(`/api/admin/companies/${c.id}`, { status: "rejected" });
                              setCompanies((prev) => prev.map((co) => co.id === c.id ? { ...co, is_verified: false, status: "rejected" } as any : co));
                              toast({ title: `${c.name} rejected` });
                            } catch { toast({ title: "Failed to reject", variant: "destructive" }); }
                          }}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* JOB FORM */}
        {view === "job-form" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => { resetJobForm(); setView("jobs"); }}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
              <h2 className="text-lg font-bold">{editingJob ? "Edit Job" : "Create Job"}</h2>
              <Button onClick={handleSaveJob} className="bg-green-600 hover:bg-green-700" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}{editingJob ? "Update" : "Create"}</Button>
            </div>
            <Card><CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Company</Label><select value={jf.company_id} onChange={(e) => setJf((f) => ({ ...f, company_id: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm"><option value="">Select company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="space-y-1"><Label>Status</Label><select value={jf.status} onChange={(e) => setJf((f) => ({ ...f, status: e.target.value as JobStatus }))} className="w-full border rounded-md px-3 py-2 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="filled">Filled</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Title</Label><Input value={jf.title} onChange={(e) => setJf((f) => ({ ...f, title: e.target.value, slug: editingJob ? f.slug : generateSlug(e.target.value) }))} /></div>
                <div className="space-y-1"><Label>Slug</Label><Input value={jf.slug} onChange={(e) => setJf((f) => ({ ...f, slug: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Job Type</Label><select value={jf.job_type} onChange={(e) => setJf((f) => ({ ...f, job_type: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">{JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div className="space-y-1"><Label>Experience Level</Label><select value={jf.experience_level} onChange={(e) => setJf((f) => ({ ...f, experience_level: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">{EXPERIENCE_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>
                <div className="space-y-1"><Label>Industry</Label><select value={jf.industry} onChange={(e) => setJf((f) => ({ ...f, industry: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">{JOB_INDUSTRIES.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Location</Label><Input value={jf.location} onChange={(e) => setJf((f) => ({ ...f, location: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Country</Label><Input value={jf.country} onChange={(e) => setJf((f) => ({ ...f, country: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Deadline</Label><Input type="datetime-local" value={jf.deadline} onChange={(e) => setJf((f) => ({ ...f, deadline: e.target.value }))} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={jf.is_remote} onChange={(e) => setJf((f) => ({ ...f, is_remote: e.target.checked }))} />Remote</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={jf.show_salary} onChange={(e) => setJf((f) => ({ ...f, show_salary: e.target.checked }))} />Show Salary</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={jf.is_featured} onChange={(e) => setJf((f) => ({ ...f, is_featured: e.target.checked }))} />Featured</label>
              </div>
              {jf.show_salary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><Label>Min Salary</Label><Input type="number" value={jf.salary_min} onChange={(e) => setJf((f) => ({ ...f, salary_min: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Max Salary</Label><Input type="number" value={jf.salary_max} onChange={(e) => setJf((f) => ({ ...f, salary_max: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Currency</Label><Input value={jf.salary_currency} onChange={(e) => setJf((f) => ({ ...f, salary_currency: e.target.value }))} /></div>
                </div>
              )}
              <div className="space-y-1"><Label>Description (Rich Text)</Label><TipTapEditor content={jf.description} onChange={(html) => setJf((f) => ({ ...f, description: html }))} placeholder="Job description..." /></div>
              <div className="space-y-1"><Label>Requirements</Label><Textarea rows={4} value={jf.requirements} onChange={(e) => setJf((f) => ({ ...f, requirements: e.target.value }))} placeholder="- Requirement 1&#10;- Requirement 2" /></div>
              <div className="space-y-1"><Label>Responsibilities</Label><Textarea rows={4} value={jf.responsibilities} onChange={(e) => setJf((f) => ({ ...f, responsibilities: e.target.value }))} placeholder="- Responsibility 1&#10;- Responsibility 2" /></div>
            </CardContent></Card>
          </div>
        )}

        {/* APPLICATIONS VIEW */}
        {view === "applications" && selectedJobForApps && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setView("jobs")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
              <h2 className="text-lg font-bold">Applications: {selectedJobForApps.title}</h2>
              <Badge variant="secondary">{applications.length} total</Badge>
            </div>
            {applications.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No applications yet.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{app.full_name}</h3>
                            <Badge variant={APPLICATION_STATUSES.find((s) => s.value === app.status)?.color as "success" | "warning" | "destructive" | "secondary" || "secondary"} className="text-xs">
                              {APPLICATION_STATUSES.find((s) => s.value === app.status)?.label || app.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{app.email}{app.phone ? ` | ${app.phone}` : ""}</p>
                          {app.cover_letter && <p className="text-sm text-gray-600 line-clamp-3">{app.cover_letter}</p>}
                          <div className="flex gap-2 text-xs">
                            {app.linkedin_url && <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">LinkedIn</a>}
                            {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">Portfolio</a>}
                            {app.resume_url && <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">Resume</a>}
                          </div>
                          <p className="text-xs text-gray-400">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col gap-1 ml-4">
                          <select value={app.status} onChange={(e) => updateAppStatus(app.id, e.target.value as ApplicationStatus)} className="text-xs border rounded px-2 py-1">
                            {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
