"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Plus, Trash2, Upload, Pencil, Eye, Mail, FileText, CheckCircle, Clock, Users, XCircle, Loader2, Calendar, BarChart3, Briefcase } from "lucide-react";
import { useContent, type ContentData } from "@/contexts/ContentContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBlog, type BlogPost } from "@/contexts/BlogContext";
import { useNewsletter } from "@/contexts/NewsletterContext";
import { uploadFile } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPut } from "@/lib/api";
import type { MentorApplication } from "@/types";
import Image from "next/image";
import dynamic from "next/dynamic";
import ActivityFeed from "@/components/ActivityFeed";
import StoreManager from "@/components/admin/StoreManager";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), { ssr: false });

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { content, updateContent, saveContent } = useContent();
  const [loading, setLoading] = useState(false);
  const [localContent, setLocalContent] = useState<ContentData>(content);
  const { logout, isAuthenticated, user, profile } = useAuth();
  const { posts, addPost, updatePost, deletePost } = useBlog();
  const { subscribers, campaigns, removeSubscriber, addCampaign, updateCampaign, deleteCampaign } = useNewsletter();

  // Blog editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author_name: "EIM Consult Team",
    image_url: "/uploads/gallery-1.png",
    published_at: new Date().toISOString().split("T")[0],
    scheduled_at: "",
    tags: "",
    category_name: "",
    status: "published" as "draft" | "published",
  });
  const [showBlogForm, setShowBlogForm] = useState(false);

  // Campaign composer state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ subject: "", content: "", preview_text: "", segment: "all" });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Management team state
  const [newMemberForm, setNewMemberForm] = useState({ name: "", role: "", image: "", linkedin: "" });
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: "", role: "", linkedin: "" });

  // Email settings state
  const [emailProvider, setEmailProvider] = useState<"gmail" | "resend">("gmail");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch email settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { settings } = await apiGet<{ settings: Record<string, string> }>("/api/admin/settings");
        const raw = settings?.email_provider;
        if (raw) {
          const val = typeof raw === "string" ? raw.replace(/"/g, "") : String(raw).replace(/"/g, "");
          if (val === "resend" || val === "gmail") setEmailProvider(val);
        }
      } catch {
        // Settings may not exist yet — use default
      }
      setSettingsLoaded(true);
    };
    if (isAuthenticated) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSaveEmailProvider = async (provider: "gmail" | "resend") => {
    setSavingSettings(true);
    setEmailProvider(provider);
    try {
      await apiPut("/api/admin/settings", { key: "email_provider", value: JSON.stringify(provider) });
      toast({ title: "Email provider updated", description: `All emails will now be sent via ${provider === "gmail" ? "Google SMTP (Gmail)" : "Resend"}.` });
    } catch (err) {
      toast({ title: "Error saving settings", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
    setSavingSettings(false);
  };

  // Mentor applications state
  const [mentorApplications, setMentorApplications] = useState<MentorApplication[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  // Fetch mentor applications
  useEffect(() => {
    const fetchApplications = async () => {
      setMentorLoading(true);
      try {
        const { applications } = await apiGet<{ applications: MentorApplication[] }>("/api/admin/mentor-applications");
        if (applications) setMentorApplications(applications);
      } catch {
        // Failed to load applications
      }
      setMentorLoading(false);
    };
    if (isAuthenticated) fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleApproveMentor = async (application: MentorApplication) => {
    try {
      await apiPut(`/api/admin/mentor-applications/${application.id}`, { status: "approved" });
      setMentorApplications((prev) =>
        prev.map((a) =>
          a.id === application.id ? { ...a, status: "approved" } : a
        )
      );
      setSelectedApplication(null);
      toast({ title: "Mentor approved", description: `${application.full_name} has been approved as a mentor.` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleRejectMentor = async (application: MentorApplication) => {
    if (!rejectionReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection.", variant: "destructive" });
      return;
    }

    try {
      await apiPut(`/api/admin/mentor-applications/${application.id}`, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });
      setMentorApplications((prev) =>
        prev.map((a) =>
          a.id === application.id ? { ...a, status: "rejected", rejection_reason: rejectionReason } : a
        )
      );
      setSelectedApplication(null);
      setRejectionReason("");
      toast({ title: "Application rejected", description: `${application.full_name}'s application has been rejected.` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  // Auth protection is handled by AuthContext — no duplicate redirect needed here

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleLogout = () => logout();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update context state (live preview)
      updateContent(localContent);

      // Persist to database with the latest local data
      const result = await saveContent(localContent);
      if (result.success) {
        toast({ title: "Changes saved", description: "All content has been saved to the database." });
      } else {
        toast({ title: "Error saving", description: result.error || "Failed to save changes.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error saving", description: "Failed to save changes. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadFile(file, "gallery");
    setUploading(false);
    if (error || !url) {
      toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
      return;
    }
    setLocalContent((prev) => ({ ...prev, carouselImages: [...prev.carouselImages, url] }));
    toast({ title: "Image uploaded", description: "Image has been added to the gallery" });
  };

  const addHeroText = () => {
    setLocalContent((prev) => ({ ...prev, heroTexts: [...prev.heroTexts, "New hero text"] }));
  };

  const updateHeroText = (index: number, value: string) => {
    setLocalContent((prev) => ({
      ...prev,
      heroTexts: prev.heroTexts.map((text, i) => (i === index ? value : text)),
    }));
  };

  const removeHeroText = (index: number) => {
    setLocalContent((prev) => ({ ...prev, heroTexts: prev.heroTexts.filter((_, i) => i !== index) }));
  };

  const removeCarouselImage = (index: number) => {
    setLocalContent((prev) => ({ ...prev, carouselImages: prev.carouselImages.filter((_, i) => i !== index) }));
  };

  // Blog handlers
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const defaultPostForm = {
    title: "", slug: "", excerpt: "", content: "",
    author_name: "EIM Consult Team", image_url: "/uploads/gallery-1.png",
    published_at: new Date().toISOString().split("T")[0], scheduled_at: "",
    tags: "", category_name: "", status: "published" as "draft" | "published",
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    await addPost({
      slug: newPost.slug || generateSlug(newPost.title),
      title: newPost.title,
      content: newPost.content,
      excerpt: newPost.excerpt,
      author_id: user?.id || null,
      author_name: newPost.author_name,
      category_id: null,
      category_name: newPost.category_name || "General",
      image_url: newPost.image_url || null,
      tags: newPost.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: newPost.status,
      published_at: newPost.status === "published" ? new Date(newPost.published_at).toISOString() : null,
      scheduled_at: newPost.scheduled_at ? new Date(newPost.scheduled_at).toISOString() : null,
    });
    setNewPost(defaultPostForm);
    setShowBlogForm(false);
    toast({ title: "Post created" });
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      image_url: post.image_url || "/uploads/gallery-1.png",
      published_at: post.published_at ? new Date(post.published_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : "",
      tags: post.tags.join(", "),
      category_name: post.category_name || "",
      status: post.status,
    });
    setShowBlogForm(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    await updatePost(editingPost.id, {
      slug: newPost.slug || generateSlug(newPost.title),
      title: newPost.title,
      content: newPost.content,
      excerpt: newPost.excerpt,
      author_name: newPost.author_name,
      category_name: newPost.category_name || "General",
      image_url: newPost.image_url || null,
      tags: newPost.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: newPost.status,
      published_at: newPost.status === "published" ? new Date(newPost.published_at).toISOString() : null,
      scheduled_at: newPost.scheduled_at ? new Date(newPost.scheduled_at).toISOString() : null,
    });
    setEditingPost(null);
    setNewPost(defaultPostForm);
    setShowBlogForm(false);
    toast({ title: "Post updated" });
  };

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
    toast({ title: "Post deleted" });
  };

  const handleSendCampaign = async (campaignId: string) => {
    setSendingCampaign(true);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Campaign sent!", description: `Delivered to ${data.delivered} of ${data.total} subscribers.` });
        await updateCampaign(campaignId, { status: "sent", sent_at: new Date().toISOString(), total_delivered: data.delivered, total_bounced: data.bounced, total_recipients: data.total });
      } else {
        toast({ title: "Send failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error sending campaign", variant: "destructive" });
    }
    setSendingCampaign(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM Consultancy" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" size="sm" disabled={loading}>
                <Save className="h-4 w-4 mr-1" />
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button onClick={() => router.push("/admin/events")} variant="outline" size="sm">
                <Calendar className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Events</span>
              </Button>
              <Button onClick={() => router.push("/admin/jobs")} variant="outline" size="sm">
                <Briefcase className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Jobs</span>
              </Button>
              <Button onClick={() => router.push("/admin/mentorship")} variant="outline" size="sm">
                <Users className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Mentorships</span>
              </Button>
              <Button onClick={() => router.push("/admin/analytics")} variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
              <Button onClick={() => router.push("/admin/users")} variant="outline" size="sm">
                <Users className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Users</span>
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" size="sm">
                <Eye className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Website</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="mentors" className="relative">
              Mentors
              {mentorApplications.filter((a) => a.status === "pending").length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {mentorApplications.filter((a) => a.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* ===== HERO TAB ===== */}
          <TabsContent value="hero">
            <Card>
              <CardHeader><CardTitle>Hero Section Texts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {localContent.heroTexts.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={text} onChange={(e) => updateHeroText(index, e.target.value)} className="flex-1" />
                    <Button onClick={() => removeHeroText(index)} variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addHeroText} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />Add Hero Text
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ABOUT TAB ===== */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle>Vision</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={localContent.vision} onChange={(e) => setLocalContent((prev) => ({ ...prev, vision: e.target.value }))} rows={6} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Mission</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={localContent.mission} onChange={(e) => setLocalContent((prev) => ({ ...prev, mission: e.target.value }))} rows={6} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>About Us</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={localContent.aboutUs} onChange={(e) => setLocalContent((prev) => ({ ...prev, aboutUs: e.target.value }))} rows={6} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== SERVICES TAB ===== */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Services</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newService = {
                        id: Date.now().toString(),
                        title: "New Service",
                        description: "Describe this service...",
                        icon: "book",
                        link: "",
                      };
                      setLocalContent((prev) => ({
                        ...prev,
                        services: [...prev.services, newService],
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {localContent.services.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No services added yet.</p>
                ) : (
                  localContent.services.map((service, index) => (
                    <div key={service.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-500">Service {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setLocalContent((prev) => ({
                              ...prev,
                              services: prev.services.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Title</label>
                          <Input
                            value={service.title}
                            onChange={(e) => {
                              const updated = [...localContent.services];
                              updated[index] = { ...updated[index], title: e.target.value };
                              setLocalContent((prev) => ({ ...prev, services: updated }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Icon</label>
                          <select
                            value={service.icon}
                            onChange={(e) => {
                              const updated = [...localContent.services];
                              updated[index] = { ...updated[index], icon: e.target.value };
                              setLocalContent((prev) => ({ ...prev, services: updated }));
                            }}
                            className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                          >
                            <option value="graduation-cap">Graduation Cap</option>
                            <option value="users">Users</option>
                            <option value="briefcase">Briefcase</option>
                            <option value="book">Book</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Description</label>
                        <Textarea
                          value={service.description}
                          onChange={(e) => {
                            const updated = [...localContent.services];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setLocalContent((prev) => ({ ...prev, services: updated }));
                          }}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Link (optional)</label>
                        <Input
                          value={service.link || ""}
                          onChange={(e) => {
                            const updated = [...localContent.services];
                            updated[index] = { ...updated[index], link: e.target.value };
                            setLocalContent((prev) => ({ ...prev, services: updated }));
                          }}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== MANAGEMENT TAB ===== */}
          <TabsContent value="management">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Management Team</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Member Form */}
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="h-4 w-4" />Add New Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Full Name *</label>
                      <Input
                        placeholder="e.g. Jane Doe"
                        value={newMemberForm.name}
                        onChange={(e) => setNewMemberForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Role / Title *</label>
                      <Input
                        placeholder="e.g. Chief Operations Officer"
                        value={newMemberForm.role}
                        onChange={(e) => setNewMemberForm((f) => ({ ...f, role: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">LinkedIn URL (optional)</label>
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={newMemberForm.linkedin}
                        onChange={(e) => setNewMemberForm((f) => ({ ...f, linkedin: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Photo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            const { url, error } = await uploadFile(file, "team");
                            setUploading(false);
                            if (url) {
                              setNewMemberForm((f) => ({ ...f, image: url }));
                              toast({ title: "Photo uploaded" });
                            } else {
                              toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
                            }
                          }}
                          className="hidden"
                          id="member-photo-upload"
                        />
                        <label htmlFor="member-photo-upload">
                          <Button variant="outline" size="sm" asChild>
                            <span><Upload className="h-3 w-3 mr-1" />Upload Photo</span>
                          </Button>
                        </label>
                        {newMemberForm.image && (
                          <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Photo selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!newMemberForm.name.trim() || !newMemberForm.role.trim()}
                    onClick={() => {
                      const newMember = {
                        id: Date.now().toString(),
                        name: newMemberForm.name.trim(),
                        role: newMemberForm.role.trim(),
                        image: newMemberForm.image || "/uploads/team-member.png",
                        linkedin: newMemberForm.linkedin.trim() || undefined,
                      };
                      const updated = [...localContent.teamMembers, newMember];
                      setLocalContent((prev) => ({ ...prev, teamMembers: updated }));
                      updateContent({ teamMembers: updated });
                      setNewMemberForm({ name: "", role: "", image: "", linkedin: "" });
                      toast({ title: "Member added" });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />Add Member
                  </Button>
                </div>

                {/* Existing Members */}
                {localContent.teamMembers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No management members added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localContent.teamMembers.map((member, index) => (
                      <div key={member.id} className="border rounded-lg overflow-hidden bg-white">
                        <div className="relative h-48">
                          <Image src={member.image} alt={member.name} fill className="object-cover" />
                        </div>
                        <div className="p-3 space-y-2">
                          {editingMemberIndex === index ? (
                            <div className="space-y-2">
                              <Input
                                value={editMemberForm.name}
                                onChange={(e) => setEditMemberForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Name"
                              />
                              <Input
                                value={editMemberForm.role}
                                onChange={(e) => setEditMemberForm((f) => ({ ...f, role: e.target.value }))}
                                placeholder="Role"
                              />
                              <Input
                                value={editMemberForm.linkedin}
                                onChange={(e) => setEditMemberForm((f) => ({ ...f, linkedin: e.target.value }))}
                                placeholder="LinkedIn URL"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    const updated = [...localContent.teamMembers];
                                    updated[index] = {
                                      ...updated[index],
                                      name: editMemberForm.name.trim(),
                                      role: editMemberForm.role.trim(),
                                      linkedin: editMemberForm.linkedin.trim() || undefined,
                                    };
                                    setLocalContent((prev) => ({ ...prev, teamMembers: updated }));
                                    updateContent({ teamMembers: updated });
                                    setEditingMemberIndex(null);
                                    toast({ title: "Member updated" });
                                  }}
                                >
                                  <Save className="h-3 w-3 mr-1" />Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMemberIndex(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold text-sm">{member.name}</h4>
                              <p className="text-xs text-green-600">{member.role}</p>
                              {member.linkedin && (
                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">LinkedIn Profile</a>
                              )}
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMemberIndex(index);
                                    setEditMemberForm({
                                      name: member.name,
                                      role: member.role,
                                      linkedin: member.linkedin || "",
                                    });
                                  }}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const updated = localContent.teamMembers.filter((_, i) => i !== index);
                                    setLocalContent((prev) => ({ ...prev, teamMembers: updated }));
                                    updateContent({ teamMembers: updated });
                                    toast({ title: "Member removed" });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />Remove
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== GALLERY TAB ===== */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader><CardTitle>Gallery Images</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>{uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Image</>}</span>
                    </Button>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {localContent.carouselImages.map((image, index) => (
                    <div key={index} className="relative">
                      <Image src={image} alt={`Gallery ${index + 1}`} width={400} height={128} className="w-full h-32 object-cover rounded-lg" />
                      <Button onClick={() => removeCarouselImage(index)} className="absolute top-2 right-2" size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CONTACT TAB ===== */}
          <TabsContent value="contact">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input value={localContent.contactInfo.address} onChange={(e) => setLocalContent((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input value={localContent.contactInfo.email} onChange={(e) => setLocalContent((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instagram</label>
                  <Input value={localContent.contactInfo.instagram} onChange={(e) => setLocalContent((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, instagram: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook</label>
                  <Input value={localContent.contactInfo.facebook} onChange={(e) => setLocalContent((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, facebook: e.target.value } }))} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== BLOG TAB ===== */}
          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Blog Posts ({posts.length} total · {posts.filter(p => p.status === "published").length} published · {posts.filter(p => p.status === "draft").length} drafts)
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setEditingPost(null);
                      setNewPost(defaultPostForm);
                      setShowBlogForm(!showBlogForm);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showBlogForm ? "Cancel" : "New Post"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Blog Form */}
                {showBlogForm && (
                  <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      {editingPost ? "Edit Post" : "Create New Post"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={newPost.title}
                          onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value, slug: generateSlug(e.target.value) }))}
                          placeholder="Post title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Slug</label>
                        <Input
                          value={newPost.slug}
                          onChange={(e) => setNewPost((p) => ({ ...p, slug: e.target.value }))}
                          placeholder="url-friendly-slug"
                        />
                      </div>
                    </div>
                    {/* Status & Scheduling */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          value={newPost.status}
                          onChange={(e) => setNewPost((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Publish Date</label>
                        <Input type="date" value={newPost.published_at} onChange={(e) => setNewPost((p) => ({ ...p, published_at: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
                        <Input
                          type="datetime-local"
                          value={newPost.scheduled_at}
                          onChange={(e) => setNewPost((p) => ({ ...p, scheduled_at: e.target.value }))}
                          title="If set, post will appear after this date/time"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Author</label>
                        <Input value={newPost.author_name} onChange={(e) => setNewPost((p) => ({ ...p, author_name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <Input value={newPost.category_name} onChange={(e) => setNewPost((p) => ({ ...p, category_name: e.target.value }))} placeholder="e.g. Mentorship" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                        <Input value={newPost.tags} onChange={(e) => setNewPost((p) => ({ ...p, tags: e.target.value }))} placeholder="Tag1, Tag2" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cover Image</label>
                      <div className="flex items-center gap-2">
                        <Input value={newPost.image_url} onChange={(e) => setNewPost((p) => ({ ...p, image_url: e.target.value }))} placeholder="URL or upload a file" className="flex-1" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            const { url, error } = await uploadFile(file, "blog");
                            setUploading(false);
                            if (url) {
                              setNewPost((p) => ({ ...p, image_url: url }));
                              toast({ title: "Cover image uploaded" });
                            } else {
                              toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
                            }
                          }}
                          className="hidden"
                          id="blog-cover-upload"
                        />
                        <label htmlFor="blog-cover-upload">
                          <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Excerpt</label>
                      <Textarea value={newPost.excerpt} onChange={(e) => setNewPost((p) => ({ ...p, excerpt: e.target.value }))} rows={2} placeholder="Brief summary..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Content (Rich Text Editor)</label>
                      <TipTapEditor
                        content={newPost.content}
                        onChange={(html) => setNewPost((p) => ({ ...p, content: html }))}
                        placeholder="Write your blog post content here..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={editingPost ? handleUpdatePost : handleCreatePost} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        {editingPost ? "Update Post" : (newPost.status === "draft" ? "Save Draft" : "Publish Post")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBlogForm(false);
                          setEditingPost(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Posts List */}
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No blog posts yet. Create your first post!</p>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between border rounded-lg p-4 bg-white">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-gray-800 truncate">{post.title}</h4>
                            {post.status === "draft" ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">
                                <Clock className="h-3 w-3" /> Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                                <CheckCircle className="h-3 w-3" /> Published
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{post.author_name}</span>
                            {post.category_name && <><span>|</span><span>{post.category_name}</span></>}
                            <span>|</span>
                            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : "Not published"}</span>
                            {post.scheduled_at && (
                              <><span>|</span><span className="text-orange-600">Scheduled: {new Date(post.scheduled_at).toLocaleString()}</span></>
                            )}
                            {post.view_count > 0 && <><span>|</span><span>{post.view_count} views</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button onClick={() => window.open(`/blog/${post.slug}`, "_blank")} variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleEditPost(post)} variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDeletePost(post.id)} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== MENTORS TAB ===== */}
          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Mentor Applications ({mentorApplications.length} total
                      {" \u00b7 "}
                      {mentorApplications.filter((a) => a.status === "pending").length} pending
                      {" \u00b7 "}
                      {mentorApplications.filter((a) => a.status === "approved").length} approved)
                    </span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {mentorLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : mentorApplications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No mentor applications yet.
                  </p>
                ) : selectedApplication ? (
                  /* Application Detail View */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(null);
                          setRejectionReason("");
                        }}
                      >
                        &larr; Back to List
                      </Button>
                      <div className="flex items-center gap-2">
                        {selectedApplication.status === "pending" && (
                          <Badge variant="warning" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                        {selectedApplication.status === "approved" && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </Badge>
                        )}
                        {selectedApplication.status === "rejected" && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg text-green-700">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Title & Name:</span>
                          <p>{selectedApplication.title} {selectedApplication.full_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Organization & Division:</span>
                          <p>{selectedApplication.organization} — {selectedApplication.division}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Work Email:</span>
                          <p>{selectedApplication.work_email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Work Phone:</span>
                          <p>{selectedApplication.work_phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Experience & Skillset */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg text-green-700">Experience & Skillset</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Positions & Grades Held:</span>
                          <p className="whitespace-pre-wrap mt-1">{selectedApplication.positions_held}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Strongest General Competencies:</span>
                          <p className="whitespace-pre-wrap mt-1">{selectedApplication.general_competencies}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Strongest Technical Competencies:</span>
                          <p className="whitespace-pre-wrap mt-1">{selectedApplication.technical_competencies}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mentorship Details */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg text-green-700">Mentorship Details</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Why Do You Want To Be a Mentor?</span>
                          <p className="whitespace-pre-wrap mt-1">{selectedApplication.why_mentor}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Max Mentees:</span>
                          <p>{selectedApplication.max_mentees}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">What Can a Mentee Learn?</span>
                          <p className="whitespace-pre-wrap mt-1">{selectedApplication.what_can_mentee_learn}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {selectedApplication.status === "pending" && (
                      <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                        <h3 className="font-semibold text-lg">Review Actions</h3>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApproveMentor(selectedApplication)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Mentor
                          </Button>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Reason for rejection (required)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="destructive"
                              onClick={() => handleRejectMentor(selectedApplication)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApplication.status === "rejected" && selectedApplication.rejection_reason && (
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {selectedApplication.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Applications List */
                  <div className="space-y-2 overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm text-gray-700 min-w-[600px]">
                      <div className="col-span-3">Applicant</div>
                      <div className="col-span-3">Organization</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    {mentorApplications.map((app) => (
                      <div
                        key={app.id}
                        className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center hover:bg-gray-50 min-w-[600px]"
                      >
                        <div className="col-span-3">
                          <p className="text-sm font-medium">{app.title} {app.full_name}</p>
                          <p className="text-xs text-muted-foreground">{app.work_email}</p>
                        </div>
                        <div className="col-span-3 text-sm text-gray-600">
                          {app.organization}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                        <div className="col-span-2">
                          {app.status === "pending" && (
                            <Badge variant="warning" className="text-xs">Pending</Badge>
                          )}
                          {app.status === "approved" && (
                            <Badge variant="success" className="text-xs">Approved</Badge>
                          )}
                          {app.status === "rejected" && (
                            <Badge variant="destructive" className="text-xs">Rejected</Badge>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== NEWSLETTER TAB ===== */}
          <TabsContent value="newsletter">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{subscribers.filter((s) => s.status === "confirmed").length}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{subscribers.filter((s) => s.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-600">{subscribers.filter((s) => s.status === "unsubscribed").length}</p><p className="text-xs text-muted-foreground">Unsubscribed</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{campaigns.length}</p><p className="text-xs text-muted-foreground">Campaigns</p></CardContent></Card>
              </div>

              {/* Subscribers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> Subscribers ({subscribers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscribers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No subscribers yet.</p>
                  ) : (
                    <div className="space-y-2 overflow-x-auto">
                      <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm text-gray-700 min-w-[600px]">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Subscribed</div>
                        <div className="col-span-2 text-right">Action</div>
                      </div>
                      {subscribers.map((sub, index) => (
                        <div key={sub.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center min-w-[600px]">
                          <div className="col-span-1 text-sm text-gray-500">{index + 1}</div>
                          <div className="col-span-4 text-sm font-medium truncate">{sub.email}</div>
                          <div className="col-span-2">
                            <Badge variant={sub.status === "confirmed" ? "success" : sub.status === "pending" ? "warning" : "secondary"} className="text-xs capitalize">{sub.status}</Badge>
                          </div>
                          <div className="col-span-3 text-sm text-gray-500">
                            {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                          </div>
                          <div className="col-span-2 text-right">
                            <Button onClick={() => removeSubscriber(sub.id)} variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Composer */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Campaigns ({campaigns.length})</CardTitle>
                    <Button onClick={() => setShowCampaignForm(!showCampaignForm)} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />{showCampaignForm ? "Cancel" : "New Campaign"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showCampaignForm && (
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                      <div className="space-y-1"><label className="block text-sm font-medium">Subject</label><Input value={campaignForm.subject} onChange={(e) => setCampaignForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Email subject line" /></div>
                      <div className="space-y-1"><label className="block text-sm font-medium">Preview Text</label><Input value={campaignForm.preview_text} onChange={(e) => setCampaignForm((f) => ({ ...f, preview_text: e.target.value }))} placeholder="Short preview shown in inbox" /></div>
                      <div className="space-y-1"><label className="block text-sm font-medium">Content (HTML)</label><TipTapEditor content={campaignForm.content} onChange={(html) => setCampaignForm((f) => ({ ...f, content: html }))} placeholder="Write your campaign content..." /></div>
                      <Button onClick={async () => {
                        if (!campaignForm.subject) { toast({ title: "Subject required", variant: "destructive" }); return; }
                        const c = await addCampaign(campaignForm);
                        if (c) { setCampaignForm({ subject: "", content: "", preview_text: "", segment: "all" }); setShowCampaignForm(false); toast({ title: "Campaign created as draft" }); }
                      }} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" />Save Draft</Button>
                    </div>
                  )}

                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No campaigns yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border rounded-lg p-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{c.subject}</h4>
                              <Badge variant={c.status === "sent" ? "success" : c.status === "sending" ? "warning" : c.status === "failed" ? "destructive" : "secondary"} className="text-xs capitalize">{c.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{new Date(c.created_at).toLocaleDateString()}</span>
                              {c.status === "sent" && (
                                <>
                                  <span>Recipients: {c.total_recipients}</span>
                                  <span>Delivered: {c.total_delivered}</span>
                                  <span>Opened: {c.total_opened}</span>
                                  <span>Clicked: {c.total_clicked}</span>
                                  {c.total_bounced > 0 && <span className="text-red-500">Bounced: {c.total_bounced}</span>}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {c.status === "draft" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleSendCampaign(c.id)} disabled={sendingCampaign}>
                                {sendingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-1" />Send</>}
                              </Button>
                            )}
                            {c.status === "draft" && (
                              <Button variant="destructive" size="sm" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== SETTINGS TAB ===== */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Email Provider */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> Email Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Choose which email service to use for all outgoing emails (contact form, newsletter confirmations, campaigns).
                    Make sure the corresponding environment variables are set on the server.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gmail Option */}
                    <button
                      onClick={() => handleSaveEmailProvider("gmail")}
                      disabled={savingSettings}
                      className={`p-5 border-2 rounded-xl text-left transition-all ${
                        emailProvider === "gmail"
                          ? "border-green-600 bg-green-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">Google SMTP (Gmail)</h3>
                        {emailProvider === "gmail" && (
                          <span className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Send emails via Gmail using your Google account. Good for small volumes.
                      </p>
                      <div className="text-xs text-gray-500 space-y-1 bg-gray-100 rounded-lg p-3">
                        <p className="font-medium text-gray-700">Required env variables:</p>
                        <p><code className="bg-white px-1 rounded">EMAIL_USER</code> — Gmail address</p>
                        <p><code className="bg-white px-1 rounded">EMAIL_PASS</code> — App password</p>
                      </div>
                    </button>

                    {/* Resend Option */}
                    <button
                      onClick={() => handleSaveEmailProvider("resend")}
                      disabled={savingSettings}
                      className={`p-5 border-2 rounded-xl text-left transition-all ${
                        emailProvider === "resend"
                          ? "border-green-600 bg-green-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">Resend</h3>
                        {emailProvider === "resend" && (
                          <span className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Professional email API. Better deliverability and designed for transactional & marketing emails.
                      </p>
                      <div className="text-xs text-gray-500 space-y-1 bg-gray-100 rounded-lg p-3">
                        <p className="font-medium text-gray-700">Required env variables:</p>
                        <p><code className="bg-white px-1 rounded">RESEND_API_KEY</code> — API key from resend.com</p>
                        <p><code className="bg-white px-1 rounded">RESEND_FROM_EMAIL</code> — Verified sender email</p>
                      </div>
                    </button>
                  </div>

                  {savingSettings && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </div>
                  )}

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Environment variables (<code>EMAIL_USER</code>, <code>EMAIL_PASS</code>, <code>RESEND_API_KEY</code>, etc.)
                      must be set on the server/hosting provider (e.g. Vercel). This setting only controls which provider the app uses —
                      it does not store credentials in the database.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== STORE TAB ===== */}
          <TabsContent value="store">
            <Card>
              <CardHeader><CardTitle>Store Management</CardTitle></CardHeader>
              <CardContent><StoreManager /></CardContent>
            </Card>
          </TabsContent>

          {/* ===== ACTIVITY TAB ===== */}
          <TabsContent value="activity">
            <ActivityFeed />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
