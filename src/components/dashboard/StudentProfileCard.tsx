"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiPut } from "@/lib/api";
import type { Profile } from "@/types";
import AvatarUpload from "@/components/dashboard/AvatarUpload";
import {
  Pencil,
  Save,
  X,
  Loader2,
  MapPin,
  GraduationCap,
  BookOpen,
  Calendar,
  Link2,
  Globe,
  Code,
  Phone,
  Mail,
  Sparkles,
  Plus,
} from "lucide-react";

interface Props {
  profile: Profile;
  email: string;
}

export default function StudentProfileCard({ profile: initialProfile, email }: Props) {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    phone: profile.phone || "",
    location: profile.location || "",
    university: profile.university || "",
    field_of_study: profile.field_of_study || "",
    graduation_year: profile.graduation_year || "",
    linkedin_url: profile.linkedin_url || "",
    portfolio_url: profile.portfolio_url || "",
    github_url: profile.github_url || "",
    skills: profile.skills || [],
    interests: profile.interests || [],
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { profile: updated } = await apiPut<{ profile: Profile }>("/api/user/profile", form);
      setProfile(updated);
      setEditing(false);
      await refreshProfile();
      toast({ title: "Profile updated" });
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({
      full_name: profile.full_name || "",
      headline: profile.headline || "",
      bio: profile.bio || "",
      phone: profile.phone || "",
      location: profile.location || "",
      university: profile.university || "",
      field_of_study: profile.field_of_study || "",
      graduation_year: profile.graduation_year || "",
      linkedin_url: profile.linkedin_url || "",
      portfolio_url: profile.portfolio_url || "",
      github_url: profile.github_url || "",
      skills: profile.skills || [],
      interests: profile.interests || [],
    });
    setEditing(false);
  };

  const addTag = (type: "skills" | "interests", value: string) => {
    const trimmed = value.trim();
    if (!trimmed || form[type].includes(trimmed)) return;
    setForm((f) => ({ ...f, [type]: [...f[type], trimmed] }));
    if (type === "skills") setSkillInput("");
    else setInterestInput("");
  };

  const removeTag = (type: "skills" | "interests", index: number) => {
    setForm((f) => ({ ...f, [type]: f[type].filter((_, i) => i !== index) }));
  };

  const linkIcon = (url: string | null, icon: React.ReactNode, label: string) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800 transition-colors">
        {icon}
        <span>{label}</span>
      </a>
    );
  };

  // ── VIEW MODE ──
  if (!editing) {
    return (
      <Card className="overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600" />
        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <AvatarUpload avatarUrl={profile.avatar_url} size="lg" editable />
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mt-12">
              <Pencil className="h-4 w-4 mr-1" />Edit Profile
            </Button>
          </div>

          {/* Name & headline */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
            {profile.headline && <p className="text-sm text-gray-600">{profile.headline}</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{email}</span>
              {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>}
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-700 mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Education */}
          {(profile.university || profile.field_of_study) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</h4>
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  {profile.university && <p className="text-sm font-medium">{profile.university}</p>}
                  {profile.field_of_study && <p className="text-sm text-gray-600">{profile.field_of_study}</p>}
                  {profile.graduation_year && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />Class of {profile.graduation_year}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />Interests
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((interest, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{interest}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(profile.linkedin_url || profile.portfolio_url || profile.github_url) && (
            <div className="mt-4 flex flex-wrap gap-4">
              {linkIcon(profile.linkedin_url, <Link2 className="h-4 w-4" />, "LinkedIn")}
              {linkIcon(profile.portfolio_url, <Globe className="h-4 w-4" />, "Portfolio")}
              {linkIcon(profile.github_url, <Code className="h-4 w-4" />, "GitHub")}
            </div>
          )}

          {/* Empty state nudge */}
          {!profile.headline && !profile.bio && (!profile.skills || profile.skills.length === 0) && (
            <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Your profile is looking empty. Add your headline, bio, skills, and more to stand out.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />Complete Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── EDIT MODE ──
  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Profile</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />Cancel
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Full Name</label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Headline</label>
              <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="e.g. Computer Science Student | Aspiring Data Scientist" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Location</label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Accra, Ghana" />
            </div>
          </div>
          <div className="space-y-1 mt-3">
            <label className="text-xs text-muted-foreground">Bio</label>
            <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell us about yourself..." />
          </div>
        </div>

        {/* Education */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />Education
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">University / Institution</label>
              <Input value={form.university} onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Field of Study</label>
              <Input value={form.field_of_study} onChange={(e) => setForm((f) => ({ ...f, field_of_study: e.target.value }))} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Graduation Year</label>
              <Input value={form.graduation_year} onChange={(e) => setForm((f) => ({ ...f, graduation_year: e.target.value }))} placeholder="e.g. 2026" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />Skills
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.skills.map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                {skill}
                <button onClick={() => removeTag("skills", i)} className="ml-0.5 hover:text-red-500"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("skills", skillInput); } }}
              placeholder="Type a skill and press Enter"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => addTag("skills", skillInput)} disabled={!skillInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Interests */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />Interests
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.interests.map((interest, i) => (
              <Badge key={i} variant="outline" className="text-xs gap-1">
                {interest}
                <button onClick={() => removeTag("interests", i)} className="ml-0.5 hover:text-red-500"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("interests", interestInput); } }}
              placeholder="Type an interest and press Enter"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => addTag("interests", interestInput)} disabled={!interestInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />LinkedIn</label>
              <Input value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Portfolio</label>
              <Input value={form.portfolio_url} onChange={(e) => setForm((f) => ({ ...f, portfolio_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Code className="h-3.5 w-3.5" />GitHub</label>
              <Input value={form.github_url} onChange={(e) => setForm((f) => ({ ...f, github_url: e.target.value }))} placeholder="https://github.com/..." />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
