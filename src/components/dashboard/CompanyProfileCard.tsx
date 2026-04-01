"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiPut } from "@/lib/api";
import type { Company } from "@/types/jobs";
import { COMPANY_SIZES, COMPANY_TYPES, JOB_INDUSTRIES } from "@/types/jobs";
import {
  Pencil, Save, X, Loader2, Building, MapPin, Globe, Calendar,
  Users, Link2, Clock, CheckCircle, XCircle,
} from "lucide-react";

interface Props {
  company: Company;
  onUpdate: (c: Company) => void;
}

export default function CompanyProfileCard({ company: initial, onUpdate }: Props) {
  const { toast } = useToast();
  const [company, setCompany] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...company });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { company: updated } = await apiPut<{ company: Company }>("/api/user/company", form);
      setCompany(updated);
      onUpdate(updated);
      setEditing(false);
      toast({ title: "Company profile updated" });
    } catch (err: unknown) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleCancel = () => { setForm({ ...company }); setEditing(false); };
  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const statusBadge = () => {
    switch (company.status) {
      case "approved": return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "rejected": return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default: return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending Review</Badge>;
    }
  };

  // VIEW MODE
  if (!editing) {
    return (
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="h-20 w-20 bg-white rounded-xl border-4 border-white shadow-md flex items-center justify-center text-blue-600">
              <Building className="h-8 w-8" />
            </div>
            <div className="flex items-center gap-2 mt-12">
              {statusBadge()}
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />Edit
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
            {company.tagline && <p className="text-sm text-gray-600">{company.tagline}</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              {company.industry && <span className="capitalize">{company.industry}</span>}
              {company.company_type && <span>&middot; {company.company_type}</span>}
              {company.company_size && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{company.company_size}</span>}
              {company.headquarters && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.headquarters}</span>}
              {company.founded_year && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Founded {company.founded_year}</span>}
            </div>
          </div>

          {company.about && <p className="text-sm text-gray-700 mt-4 leading-relaxed">{company.about}</p>}
          {!company.about && company.description && <p className="text-sm text-gray-700 mt-4">{company.description}</p>}

          {company.specialties && company.specialties.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {company.specialties.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}

          {(company.website || company.linkedin_url) && (
            <div className="mt-4 flex flex-wrap gap-4">
              {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"><Globe className="h-4 w-4" />Website</a>}
              {company.linkedin_url && <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"><Link2 className="h-4 w-4" />LinkedIn</a>}
            </div>
          )}

          {company.status === "pending" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Your company profile is under review. You&apos;ll be able to post jobs once approved.</p>
            </div>
          )}
          {company.status === "rejected" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">Your company was not approved. Please update your profile and contact an administrator.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit Company Profile</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Company Name</label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Tagline</label><Input value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Industry</label>
            <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              {JOB_INDUSTRIES.map((i) => <option key={i} value={i} className="capitalize">{i}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Company Type</label>
            <select value={form.company_type || ""} onChange={(e) => set("company_type", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Select</option>
              {COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Company Size</label>
            <select value={form.company_size || ""} onChange={(e) => set("company_size", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">Select</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Founded Year</label><Input value={form.founded_year || ""} onChange={(e) => set("founded_year", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Website</label><Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Headquarters</label><Input value={form.headquarters || ""} onChange={(e) => set("headquarters", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Contact Email</label><Input value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">Contact Phone</label><Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          <div className="space-y-1"><label className="text-xs text-muted-foreground">LinkedIn</label><Input value={form.linkedin_url || ""} onChange={(e) => set("linkedin_url", e.target.value)} /></div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">About</label>
          <Textarea value={form.about || ""} onChange={(e) => set("about", e.target.value)} rows={4} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Description</label>
          <Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>
      </CardContent>
    </Card>
  );
}
