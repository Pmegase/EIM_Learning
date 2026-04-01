"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import {
  Briefcase, Loader2, MapPin, Building, ExternalLink,
} from "lucide-react";

interface ApplicationWithJob {
  id: string;
  status: string;
  created_at: string;
  job: { title: string; slug: string; location: string | null; job_type: string; status: string } | null;
  company: { name: string; logo_url: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  submitted: { label: "Submitted", variant: "secondary" },
  reviewing: { label: "Under Review", variant: "warning" },
  shortlisted: { label: "Shortlisted", variant: "success" },
  interview: { label: "Interview", variant: "success" },
  offered: { label: "Offered", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "secondary" },
};

export default function MyApplications() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      const data = await apiGet<{ applications: ApplicationWithJob[] }>("/api/user/my-applications");
      setApplications(data.applications);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  if (loading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></CardContent></Card>;
  }

  if (applications.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-5 w-5 text-green-600" />
          My Applications
          <Badge variant="secondary" className="text-xs">{applications.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {applications.map((app) => {
            const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
            return (
              <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {app.job?.title || "Unknown Position"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {app.company && <span>{app.company.name}</span>}
                      {app.job?.location && (
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{app.job.location}</span>
                      )}
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                  {app.job?.slug && (
                    <Link href={`/jobs/${app.job.slug}`} className="text-green-600 hover:text-green-800">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
