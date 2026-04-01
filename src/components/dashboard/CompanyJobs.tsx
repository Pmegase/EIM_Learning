"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { JobPosting } from "@/types/jobs";
import { JOB_TYPES, EXPERIENCE_LEVELS, JOB_INDUSTRIES } from "@/types/jobs";
import {
  Briefcase, Plus, Loader2, Eye, Pencil, Trash2, X, Save, Users,
} from "lucide-react";

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  draft: "secondary",
  published: "success",
  closed: "warning",
  filled: "destructive",
};

interface Props {
  companyApproved: boolean;
}

export default function CompanyJobs({ companyApproved }: Props) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: "", description: "", requirements: "", responsibilities: "",
    job_type: "full-time" as string, experience_level: "entry" as string,
    industry: "technology" as string, location: "", country: "",
    is_remote: false, salary_min: "", salary_max: "", salary_currency: "GHS",
    show_salary: false, deadline: "", status: "draft" as string,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiGet<{ jobs: JobPosting[] }>("/api/user/company/jobs");
      setJobs(data.jobs);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const openNew = () => { setForm(emptyForm); setEditingJob(null); setShowForm(true); };

  const openEdit = (job: JobPosting) => {
    setForm({
      title: job.title, description: job.description, requirements: job.requirements,
      responsibilities: job.responsibilities, job_type: job.job_type,
      experience_level: job.experience_level, industry: job.industry,
      location: job.location || "", country: job.country || "",
      is_remote: job.is_remote, salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "", salary_currency: job.salary_currency,
      show_salary: job.show_salary, deadline: job.deadline?.slice(0, 10) || "",
      status: job.status,
    });
    setEditingJob(job);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Title and description are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      if (editingJob) {
        const { job } = await apiPut<{ job: JobPosting }>(`/api/user/company/jobs/${editingJob.id}`, payload);
        setJobs((prev) => prev.map((j) => j.id === job.id ? job : j));
        toast({ title: "Job updated" });
      } else {
        const { job } = await apiPost<{ job: JobPosting }>("/api/user/company/jobs", payload);
        setJobs((prev) => [job, ...prev]);
        toast({ title: "Job created" });
      }
      setShowForm(false);
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/user/company/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast({ title: "Job deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-5 w-5 text-green-600" />
            Job Postings
          </CardTitle>
          {companyApproved && !showForm && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />Post Job
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!companyApproved && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Your company must be approved before you can post jobs.
          </div>
        )}

        {/* Job form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{editingJob ? "Edit Job" : "New Job Posting"}</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="space-y-1"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Description *</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} /></div>
            <div className="space-y-1"><Label className="text-xs">Requirements</Label><Textarea value={form.requirements} onChange={(e) => set("requirements", e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label className="text-xs">Responsibilities</Label><Textarea value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} rows={2} /></div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Job Type</Label>
                <select value={form.job_type} onChange={(e) => set("job_type", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Experience</Label>
                <select value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  {EXPERIENCE_LEVELS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Industry</Label>
                <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  {JOB_INDUSTRIES.map((i) => <option key={i} value={i} className="capitalize">{i}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.is_remote} onChange={(e) => set("is_remote", e.target.checked)} />
                Remote
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.show_salary} onChange={(e) => set("show_salary", e.target.checked)} />
                Show Salary
              </label>
            </div>

            {form.show_salary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Min Salary</Label><Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Max Salary</Label><Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Currency</Label><Input value={form.salary_currency} onChange={(e) => set("salary_currency", e.target.value)} /></div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingJob ? "Update Job" : "Create Job"}
            </Button>
          </div>
        )}

        {/* Job list */}
        {companyApproved && jobs.length === 0 && !showForm && (
          <div className="text-center py-6">
            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No jobs posted yet</p>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <Badge variant={STATUS_BADGE[job.status] || "secondary"} className="text-[10px]">{job.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{job.location || "Remote"}</span>
                    <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{job.application_count} applicants</span>
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(job)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(job.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
