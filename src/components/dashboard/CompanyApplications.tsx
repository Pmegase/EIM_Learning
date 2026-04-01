"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import StudentProfileDialog from "@/components/dashboard/StudentProfileDialog";
import type { ApplicationStatus } from "@/types/jobs";
import { APPLICATION_STATUSES } from "@/types/jobs";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import {
  Users, Loader2, Eye, ChevronDown, ChevronUp, Mail, Phone,
  Link2, FileText,
} from "lucide-react";

interface ApplicationWithJob {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  created_at: string;
  job_title: string;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  submitted: "secondary", reviewing: "warning", shortlisted: "success",
  interview: "success", offered: "success", rejected: "destructive", withdrawn: "secondary",
};

export default function CompanyApplications() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchApps = useCallback(async () => {
    try {
      const data = await apiGet<{ applications: ApplicationWithJob[] }>("/api/user/company/applications");
      setApplications(data.applications);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setUpdatingId(id);
    try {
      await apiPut(`/api/user/company/applications/${id}`, { status });
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      toast({ title: `Application ${status}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></CardContent></Card>;
  }

  if (applications.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-green-600" />
              Applications
              <Badge variant="secondary" className="text-xs">{applications.length}</Badge>
            </CardTitle>
            <div className="flex rounded-lg border overflow-hidden">
              {["all", "submitted", "reviewing", "shortlisted", "interview", "offered", "rejected"].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`px-2 py-1 text-[10px] font-medium capitalize transition-colors ${filter === s ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No {filter} applications.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((app) => {
                const isExpanded = expandedId === app.id;
                return (
                  <div key={app.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar avatarUrl={null} size="sm" fallbackColor="blue" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{app.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">Applied for: {app.job_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={STATUS_BADGE[app.status] || "secondary"} className="text-xs">
                          {APPLICATION_STATUSES.find((s) => s.value === app.status)?.label || app.status}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
                        {/* Contact */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                          {app.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>}
                          {app.linkedin_url && <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600"><Link2 className="h-3 w-3" />LinkedIn</a>}
                          {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600"><Link2 className="h-3 w-3" />Portfolio</a>}
                        </div>

                        {/* Cover letter */}
                        {app.cover_letter && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Cover Letter</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">{app.cover_letter}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewingUserId(app.user_id); }}>
                            <Eye className="h-4 w-4 mr-1" />View Profile
                          </Button>

                          {app.status === "submitted" && (
                            <>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(app.id, "reviewing")} disabled={updatingId === app.id}>
                                {updatingId === app.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Review
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")} disabled={updatingId === app.id}>Reject</Button>
                            </>
                          )}
                          {app.status === "reviewing" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, "shortlisted")} disabled={updatingId === app.id}>Shortlist</Button>
                              <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")} disabled={updatingId === app.id}>Reject</Button>
                            </>
                          )}
                          {app.status === "shortlisted" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, "interview")} disabled={updatingId === app.id}>Schedule Interview</Button>
                              <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")} disabled={updatingId === app.id}>Reject</Button>
                            </>
                          )}
                          {app.status === "interview" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, "offered")} disabled={updatingId === app.id}>Offer</Button>
                              <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")} disabled={updatingId === app.id}>Reject</Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingUserId && (
        <StudentProfileDialog userId={viewingUserId} onClose={() => setViewingUserId(null)} />
      )}
    </>
  );
}
