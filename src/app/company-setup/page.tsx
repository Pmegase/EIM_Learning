"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { JOB_INDUSTRIES, COMPANY_SIZES, COMPANY_TYPES } from "@/types/jobs";
import type { Company } from "@/types/jobs";
import Image from "next/image";
import {
  Loader2, Building, Briefcase, Globe, ChevronRight, ChevronLeft, CheckCircle,
} from "lucide-react";

const steps = [
  { id: 1, title: "Basic Information", icon: Building },
  { id: 2, title: "Company Details", icon: Briefcase },
  { id: 3, title: "About & Culture", icon: Globe },
];

export default function CompanySetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    industry: "technology",
    company_type: "Private",
    company_size: "1-10",
    founded_year: "",
    website: "",
    headquarters: "",
    location: "",
    country: "",
    description: "",
    about: "",
    specialties: [] as string[],
    linkedin_url: "",
    twitter_url: "",
    facebook_url: "",
    contact_email: "",
    contact_phone: "",
  });

  const [specialtyInput, setSpecialtyInput] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || profile?.role !== "corporate")) {
      router.replace("/dashboard");
    }
  }, [user, profile, isLoading, router]);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const data = await apiGet<{ company: Company | null }>("/api/user/company");
        if (data.company) setAlreadyExists(true);
      } catch { /* ignore */ }
    };
    if (user) checkExisting();
  }, [user]);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, contact_email: user.email || "" }));
    if (profile?.full_name) setForm((f) => ({ ...f, name: "" }));
  }, [user, profile]);

  const addSpecialty = () => {
    const v = specialtyInput.trim();
    if (v && !form.specialties.includes(v)) {
      setForm((f) => ({ ...f, specialties: [...f.specialties, v] }));
      setSpecialtyInput("");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/user/company", form);
      setSubmitted(true);
      toast({ title: "Company profile submitted for review!" });
    } catch (err: unknown) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  if (alreadyExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-lg font-semibold">Company Already Registered</h2>
            <p className="text-sm text-muted-foreground">You already have a company profile. Go to your dashboard to manage it.</p>
            <Button onClick={() => router.push("/dashboard")} className="bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-lg font-semibold">Company Profile Submitted!</h2>
            <p className="text-sm text-muted-foreground">Your company profile is under review. An administrator will approve it shortly.</p>
            <Button onClick={() => router.push("/dashboard")} className="bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 w-auto mr-3" />
          <h1 className="text-lg font-bold text-gray-900">Company Setup</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step) => (
            <div key={step.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${currentStep === step.id ? "bg-green-600 text-white" : currentStep > step.id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              <step.icon className="h-3.5 w-3.5" />
              {step.title}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>{steps[currentStep - 1].title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 1 && (
              <>
                <div className="space-y-1">
                  <Label>Company Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Acme Inc." />
                </div>
                <div className="space-y-1">
                  <Label>Tagline</Label>
                  <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Brief company description in one line" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Industry *</Label>
                    <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      {JOB_INDUSTRIES.map((ind) => <option key={ind} value={ind} className="capitalize">{ind}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Company Type</Label>
                    <select value={form.company_type} onChange={(e) => set("company_type", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      {COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Company Size</Label>
                    <select value={form.company_size} onChange={(e) => set("company_size", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Founded Year</Label>
                    <Input value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)} placeholder="e.g. 2015" />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-1">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Headquarters</Label>
                    <Input value={form.headquarters} onChange={(e) => set("headquarters", e.target.value)} placeholder="e.g. Accra, Ghana" />
                  </div>
                  <div className="space-y-1">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Office location" />
                  </div>
                  <div className="space-y-1">
                    <Label>Country</Label>
                    <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. Ghana" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Contact Email</Label>
                    <Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contact Phone</Label>
                    <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>LinkedIn</Label>
                  <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/company/..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Twitter / X</Label>
                    <Input value={form.twitter_url} onChange={(e) => set("twitter_url", e.target.value)} placeholder="https://twitter.com/..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Facebook</Label>
                    <Input value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="space-y-1">
                  <Label>Short Description</Label>
                  <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="A brief description for listings" />
                </div>
                <div className="space-y-1">
                  <Label>About the Company</Label>
                  <Textarea value={form.about} onChange={(e) => set("about", e.target.value)} rows={5} placeholder="Tell potential employees about your company, culture, mission..." />
                </div>
                <div className="space-y-1">
                  <Label>Specialties</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.specialties.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                        {s}
                        <button onClick={() => setForm((f) => ({ ...f, specialties: f.specialties.filter((_, j) => j !== i) }))} className="hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={specialtyInput} onChange={(e) => setSpecialtyInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpecialty(); } }} placeholder="Add a specialty" />
                    <Button variant="outline" size="sm" onClick={addSpecialty} disabled={!specialtyInput.trim()}>Add</Button>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} disabled={currentStep === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />Back
              </Button>
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep((s) => s + 1)} className="bg-green-600 hover:bg-green-700">
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : <>Submit for Review<CheckCircle className="h-4 w-4 ml-1" /></>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
