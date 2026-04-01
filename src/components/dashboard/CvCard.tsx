"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiDelete } from "@/lib/api";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function CvCard() {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hasMentor, setHasMentor] = useState(false);

  const fetchCv = useCallback(async () => {
    try {
      const data = await apiGet<{ cv_url: string | null }>("/api/user/cv");
      setCvUrl(data.cv_url);
    } catch {
      // No CV yet
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCv();
  }, [fetchCv]);

  // Check if student has an active mentorship
  useEffect(() => {
    const checkMentor = async () => {
      try {
        const data = await apiGet<{ has_mentor: boolean }>("/api/user/my-mentorship");
        setHasMentor(data.has_mentor);
      } catch {
        // ignore
      }
    };
    checkMentor();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCvUrl(data.cv_url);
      await refreshProfile();
      toast({ title: "CV uploaded successfully" });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleView = async () => {
    try {
      const data = await apiGet<{ signed_url: string | null }>("/api/user/cv");
      if (data.signed_url) {
        window.open(data.signed_url, "_blank");
      } else {
        toast({ title: "No CV found", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to open CV", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete("/api/user/cv");
      setCvUrl(null);
      setConfirmDelete(false);
      await refreshProfile();
      toast({ title: "CV deleted" });
    } catch {
      toast({ title: "Failed to delete CV", variant: "destructive" });
    }
    setDeleting(false);
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-green-600" />
          My CV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />

        {!cvUrl ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center space-y-3">
            <FileText className="h-10 w-10 text-gray-300 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-700">No CV uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your CV to share with mentors and use when applying to jobs
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CV (PDF)
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">PDF only, max 10MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">CV uploaded</p>
                <p className="text-xs text-muted-foreground truncate">
                  {cvUrl.split("/").pop()}
                </p>
              </div>
              <Badge variant="success" className="flex-shrink-0 text-xs">Active</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleView}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Replace
              </Button>
              {!confirmDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Confirm
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Sharing info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              {hasMentor ? (
                <>
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>Your CV is visible to your mentor</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                  <span>Your CV is private</span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
