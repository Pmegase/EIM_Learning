"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPut } from "@/lib/api";
import type { Mentorship, MentorshipStatus } from "@/types/jobs";
import type { MentorApplication, Profile } from "@/types";
import Image from "next/image";
import {
  Loader2, LayoutDashboard, LogOut, Briefcase, Users, CheckCircle, XCircle, Clock, Eye,
  ArrowLeft, User, Heart, Search,
} from "lucide-react";

type View = "list" | "detail";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  pending: { label: "Pending", variant: "warning" },
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
  declined: { label: "Declined", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

interface MentorshipWithProfiles extends Mentorship {
  mentor: Profile;
  mentee: Profile;
}

export default function AdminMentorshipPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, role, isLoading: authLoading, logout } = useAuth();

  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);
  const [mentorships, setMentorships] = useState<MentorshipWithProfiles[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<MentorshipWithProfiles | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats
  const [approvedMentors, setApprovedMentors] = useState(0);
  const [activePairings, setActivePairings] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { mentorships: mData, approvedMentorCount } = await apiGet<{ mentorships: MentorshipWithProfiles[]; approvedMentorCount?: number }>("/api/admin/mentorship");
      setMentorships(mData);
      setApprovedMentors(approvedMentorCount ?? 0);
      const activeCount = mData.filter((m) => m.status === "active").length;
      setActivePairings(activeCount);
    } catch (err) {
      console.error("Failed to fetch mentorships:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated && role === "admin") fetchData(); }, [isAuthenticated, role, fetchData]);
  useEffect(() => { if (!authLoading && (!isAuthenticated || role !== "admin")) router.replace("/login"); }, [authLoading, isAuthenticated, role, router]);

  const updateStatus = async (id: string, status: MentorshipStatus) => {
    try {
      await apiPut(`/api/admin/mentorship/${id}`, { status });
      toast({ title: `Mentorship ${status}` });
      fetchData();
      if (selectedMentorship?.id === id) {
        setSelectedMentorship((prev) => prev ? { ...prev, status, ...(status === "active" ? { started_at: new Date().toISOString() } : {}), ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) } : null);
      }
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update mentorship", variant: "destructive" });
    }
  };

  const filtered = mentorships.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.mentor?.full_name?.toLowerCase().includes(q) || m.mentee?.full_name?.toLowerCase().includes(q);
    }
    return true;
  });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mentorship Management</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Button>
              <Button onClick={() => router.push("/admin/jobs")} variant="outline" size="sm"><Briefcase className="h-4 w-4 mr-1" />Jobs</Button>
              <Button onClick={() => router.push("/admin/users")} variant="outline" size="sm"><Users className="h-4 w-4 mr-1" />Users</Button>
              <Button onClick={logout} variant="outline" size="sm"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "list" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center"><Users className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{approvedMentors}</p><p className="text-xs text-muted-foreground">Approved Mentors</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center"><Heart className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{activePairings}</p><p className="text-xs text-muted-foreground">Active Pairings</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
                <div><p className="text-2xl font-bold">{mentorships.filter((m) => m.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending Requests</p></div>
              </CardContent></Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex rounded-lg border overflow-hidden">
                {["all", "pending", "active", "completed", "declined"].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 text-sm capitalize ${statusFilter === s ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No mentorships found.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((m) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-green-600" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.mentor?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">Mentor</p>
                          </div>
                        </div>
                        <span className="text-gray-300">&rarr;</span>
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center"><User className="h-4 w-4 text-blue-600" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.mentee?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">Mentee</p>
                          </div>
                        </div>
                        <Badge variant={STATUS_CONFIG[m.status]?.variant || "secondary"} className="text-xs ml-2">
                          {STATUS_CONFIG[m.status]?.label || m.status}
                        </Badge>
                        <span className="text-xs text-gray-400 ml-auto">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedMentorship(m); setView("detail"); }}><Eye className="h-4 w-4" /></Button>
                        {m.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(m.id, "active")}><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(m.id, "declined")}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedMentorship && (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mentor */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-green-600" />Mentor</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-lg">{selectedMentorship.mentor?.full_name}</p>
                  <p className="text-sm text-gray-500">Role: {selectedMentorship.mentor?.role}</p>
                  {selectedMentorship.mentor?.bio && <p className="text-sm text-gray-600">{selectedMentorship.mentor.bio}</p>}
                </CardContent>
              </Card>

              {/* Mentee */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-blue-600" />Mentee</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-lg">{selectedMentorship.mentee?.full_name}</p>
                  <p className="text-sm text-gray-500">Role: {selectedMentorship.mentee?.role}</p>
                  {selectedMentorship.mentee?.bio && <p className="text-sm text-gray-600">{selectedMentorship.mentee.bio}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Request Details</CardTitle>
                  <Badge variant={STATUS_CONFIG[selectedMentorship.status]?.variant || "secondary"}>
                    {STATUS_CONFIG[selectedMentorship.status]?.label || selectedMentorship.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedMentorship.message && (
                  <div><p className="text-xs font-medium text-gray-500">Message</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMentorship.message}</p></div>
                )}
                {selectedMentorship.goals && (
                  <div><p className="text-xs font-medium text-gray-500">Goals</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMentorship.goals}</p></div>
                )}
                {selectedMentorship.preferred_schedule && (
                  <div><p className="text-xs font-medium text-gray-500">Preferred Schedule</p><p className="text-sm text-gray-700">{selectedMentorship.preferred_schedule}</p></div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Requested: {new Date(selectedMentorship.created_at).toLocaleDateString()}</span>
                  {selectedMentorship.started_at && <span>| Started: {new Date(selectedMentorship.started_at).toLocaleDateString()}</span>}
                  {selectedMentorship.completed_at && <span>| Completed: {new Date(selectedMentorship.completed_at).toLocaleDateString()}</span>}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedMentorship.status === "pending" && (
                    <>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(selectedMentorship.id, "active")}><CheckCircle className="h-4 w-4 mr-1" />Approve & Activate</Button>
                      <Button variant="destructive" onClick={() => updateStatus(selectedMentorship.id, "declined")}><XCircle className="h-4 w-4 mr-1" />Decline</Button>
                    </>
                  )}
                  {selectedMentorship.status === "active" && (
                    <Button variant="outline" onClick={() => updateStatus(selectedMentorship.id, "completed")}><CheckCircle className="h-4 w-4 mr-1" />Mark Completed</Button>
                  )}
                  {(selectedMentorship.status === "active" || selectedMentorship.status === "pending") && (
                    <Button variant="outline" onClick={() => updateStatus(selectedMentorship.id, "cancelled")}><XCircle className="h-4 w-4 mr-1" />Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
