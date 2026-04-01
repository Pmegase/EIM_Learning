"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import {
  Activity,
  FileText,
  Users,
  Calendar,
  Briefcase,
  Mail,
  Save,
  Upload,
  Settings,
  LogIn,
  UserPlus,
  Loader2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  category: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const PAGE_SIZE = 20;

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  "cms.save": { label: "saved site content", icon: <Save className="h-4 w-4 text-blue-600" /> },
  "blog.create": { label: "created a blog post", icon: <FileText className="h-4 w-4 text-green-600" /> },
  "blog.update": { label: "updated a blog post", icon: <FileText className="h-4 w-4 text-yellow-600" /> },
  "blog.delete": { label: "deleted a blog post", icon: <Trash2 className="h-4 w-4 text-red-600" /> },
  "mentor.approve": { label: "approved mentor application for", icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
  "mentor.reject": { label: "rejected mentor application for", icon: <XCircle className="h-4 w-4 text-red-600" /> },
  "event.create": { label: "created an event", icon: <Calendar className="h-4 w-4 text-green-600" /> },
  "event.update": { label: "updated an event", icon: <Calendar className="h-4 w-4 text-yellow-600" /> },
  "event.delete": { label: "deleted an event", icon: <Trash2 className="h-4 w-4 text-red-600" /> },
  "job.create": { label: "created a job posting", icon: <Briefcase className="h-4 w-4 text-green-600" /> },
  "job.update": { label: "updated a job posting", icon: <Briefcase className="h-4 w-4 text-yellow-600" /> },
  "job.delete": { label: "deleted a job posting", icon: <Trash2 className="h-4 w-4 text-red-600" /> },
  "newsletter.send": { label: "sent a newsletter campaign", icon: <Mail className="h-4 w-4 text-purple-600" /> },
  "settings.update": { label: "updated settings", icon: <Settings className="h-4 w-4 text-gray-600" /> },
  "gallery.upload": { label: "uploaded a gallery image", icon: <Upload className="h-4 w-4 text-blue-600" /> },
  "user.login": { label: "logged in", icon: <LogIn className="h-4 w-4 text-gray-600" /> },
  "user.signup": { label: "signed up", icon: <UserPlus className="h-4 w-4 text-green-600" /> },
  "mentor.apply": { label: "submitted a mentor application", icon: <Users className="h-4 w-4 text-blue-600" /> },
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "admin" | "user">("all");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchLogs = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const offset = (pageNum - 1) * PAGE_SIZE;
        const params = new URLSearchParams({
          offset: String(offset),
          limit: String(PAGE_SIZE),
          ...(filter !== "all" ? { category: filter } : {}),
        });

        const { logs: entries, total: count } = await apiGet<{ logs: ActivityLog[]; total: number }>(
          `/api/admin/activity-logs?${params.toString()}`
        );

        setLogs(entries);
        setTotal(count);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
      }
      setLoading(false);
    },
    [filter]
  );

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const filterButtons: { value: "all" | "admin" | "user"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <div className="flex rounded-lg border overflow-hidden">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === btn.value
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || {
                label: log.action,
                icon: <ShieldCheck className="h-4 w-4 text-gray-500" />,
              };

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-3"
                >
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium text-gray-900">{log.user_name}</span>{" "}
                      <span className="text-gray-600">{config.label}</span>
                      {log.resource_name && (
                        <span className="font-medium text-gray-900">
                          {" "}&ldquo;{log.resource_name}&rdquo;
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(log.created_at)}
                    </p>
                  </div>
                  <Badge
                    variant={log.category === "admin" ? "default" : "secondary"}
                    className="text-[10px] flex-shrink-0"
                  >
                    {log.category}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({total} entries)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
