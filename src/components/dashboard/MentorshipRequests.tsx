"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";
import StudentProfileDialog from "@/components/dashboard/StudentProfileDialog";
import ChatWindow from "@/components/dashboard/ChatWindow";
import type { MentorshipStatus } from "@/types/jobs";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import {
  Loader2,
  Eye,
  CheckCircle,
  MessageCircle,
  XCircle,
  Clock,
  MessageSquare,
  Target,
  CalendarClock,
  Inbox,
} from "lucide-react";

interface MenteeProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  university: string | null;
  field_of_study: string | null;
}

interface MentorshipRequest {
  id: string;
  mentee_id: string;
  message: string | null;
  goals: string | null;
  preferred_schedule: string | null;
  status: MentorshipStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  mentee: MenteeProfile | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  pending: { label: "Pending", variant: "warning" },
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
  declined: { label: "Declined", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const FILTERS = ["all", "pending", "active", "completed", "declined"] as const;

export default function MentorshipRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatMentorship, setChatMentorship] = useState<{ id: string; menteeName: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiGet<{ requests: MentorshipRequest[] }>("/api/user/mentorship-requests");
      setRequests(data.requests);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (id: string, status: MentorshipStatus) => {
    setUpdatingId(id);
    try {
      await apiPut(`/api/user/mentorship-requests/${id}`, { status });
      setRequests((prev) =>
        prev.map((r) => r.id === id ? {
          ...r,
          status,
          ...(status === "active" ? { started_at: new Date().toISOString() } : {}),
          ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
        } : r)
      );
      toast({ title: `Mentorship ${status}` });
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setUpdatingId(null);
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox className="h-5 w-5 text-green-600" />
              Mentorship Requests
              {pendingCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </CardTitle>
            <div className="flex rounded-lg border overflow-hidden">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    filter === f ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "No mentorship requests yet." : `No ${filter} requests.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedId === req.id;

                return (
                  <div key={req.id} className="border rounded-lg overflow-hidden">
                    {/* Header row */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar avatarUrl={req.mentee?.avatar_url ?? null} size="sm" fallbackColor="blue" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{req.mentee?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {req.mentee?.headline || req.mentee?.university || "Student"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                        <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
                        {req.message && (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-500">Message</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.message}</p>
                            </div>
                          </div>
                        )}
                        {req.goals && (
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-500">Goals</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.goals}</p>
                            </div>
                          </div>
                        )}
                        {req.preferred_schedule && (
                          <div className="flex items-start gap-2">
                            <CalendarClock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-500">Preferred Schedule</p>
                              <p className="text-sm text-gray-700">{req.preferred_schedule}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setViewingUserId(req.mentee_id); }}
                          >
                            <Eye className="h-4 w-4 mr-1" />View Profile
                          </Button>

                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, "active"); }}
                                disabled={updatingId === req.id}
                              >
                                {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Accept
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, "declined"); }}
                                disabled={updatingId === req.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />Decline
                              </Button>
                            </>
                          )}
                          {req.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => { e.stopPropagation(); setChatMentorship({ id: req.id, menteeName: req.mentee?.full_name || "Mentee" }); }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />Chat
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, "completed"); }}
                                disabled={updatingId === req.id}
                              >
                                {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Mark Complete
                              </Button>
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
        <StudentProfileDialog
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}

      {chatMentorship && (
        <ChatWindow
          mentorshipId={chatMentorship.id}
          otherUserName={chatMentorship.menteeName}
          onClose={() => setChatMentorship(null)}
        />
      )}
    </>
  );
}
