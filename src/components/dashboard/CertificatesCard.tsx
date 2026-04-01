"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiDelete } from "@/lib/api";
import type { Certificate } from "@/types";
import {
  Award,
  Upload,
  Trash2,
  Eye,
  Loader2,
  Plus,
  X,
} from "lucide-react";

export default function CertificatesCard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [certName, setCertName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const data = await apiGet<{ certificates: Certificate[] }>("/api/user/certificates");
      setCertificates(data.certificates);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    if (!certName) {
      setCertName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (certName.trim()) formData.append("name", certName.trim());

      const res = await fetch("/api/user/certificates", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCertificates((prev) => [data.certificate, ...prev]);
      setShowUploadForm(false);
      setCertName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Certificate uploaded" });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setUploading(false);
  };

  const handleView = async (id: string) => {
    try {
      const data = await apiGet<{ signed_url: string }>(`/api/user/certificates/${id}`);
      window.open(data.signed_url, "_blank");
    } catch {
      toast({ title: "Failed to open certificate", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiDelete(`/api/user/certificates/${id}`);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Certificate deleted" });
    } catch {
      toast({ title: "Failed to delete certificate", variant: "destructive" });
    }
    setDeletingId(null);
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-5 w-5 text-green-600" />
            My Certificates
          </CardTitle>
          {!showUploadForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload form */}
        {showUploadForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Upload Certificate</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowUploadForm(false);
                  setCertName("");
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Certificate name (e.g. AWS Solutions Architect)"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
              >
                <Upload className="h-4 w-4 mr-1" />
                {selectedFile ? "Change file" : "Select PDF"}
              </Button>
              {selectedFile && (
                <span className="text-xs text-muted-foreground truncate">
                  {selectedFile.name}
                </span>
              )}
            </div>
            <Button
              onClick={handleUpload}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Certificate
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">PDF only, max 10MB</p>
          </div>
        )}

        {/* Certificate list */}
        {certificates.length === 0 && !showUploadForm ? (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center space-y-3">
            <Award className="h-10 w-10 text-gray-300 mx-auto" />
            <div>
              <p className="text-sm font-medium text-gray-700">No certificates uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your certificates to showcase your qualifications
              </p>
            </div>
            <Button
              onClick={() => setShowUploadForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Certificate
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(cert.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(cert.id)}
                    disabled={deletingId === cert.id}
                  >
                    {deletingId === cert.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
