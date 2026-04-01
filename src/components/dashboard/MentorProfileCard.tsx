"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiPut } from "@/lib/api";
import type { MentorApplication } from "@/types";
import {
  FileText,
  Pencil,
  Save,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  application: MentorApplication;
  onUpdate: (app: MentorApplication) => void;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
    case "approved":
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function MentorProfileCard({ application, onUpdate }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: application.title,
    full_name: application.full_name,
    organization: application.organization,
    division: application.division,
    work_email: application.work_email,
    work_phone: application.work_phone,
    positions_held: application.positions_held,
    general_competencies: application.general_competencies,
    technical_competencies: application.technical_competencies,
    why_mentor: application.why_mentor,
    max_mentees: application.max_mentees,
    what_can_mentee_learn: application.what_can_mentee_learn,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { application: updated } = await apiPut<{ application: MentorApplication }>(
        "/api/user/mentor-application",
        form
      );
      onUpdate(updated);
      setEditing(false);
      toast({ title: "Profile updated successfully" });
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
      title: application.title,
      full_name: application.full_name,
      organization: application.organization,
      division: application.division,
      work_email: application.work_email,
      work_phone: application.work_phone,
      positions_held: application.positions_held,
      general_competencies: application.general_competencies,
      technical_competencies: application.technical_competencies,
      why_mentor: application.why_mentor,
      max_mentees: application.max_mentees,
      what_can_mentee_learn: application.what_can_mentee_learn,
    });
    setEditing(false);
  };

  const Field = ({ label, field, type = "input" }: { label: string; field: keyof typeof form; type?: "input" | "textarea" | "number" }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        type === "textarea" ? (
          <Textarea
            value={form[field] as string}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            rows={3}
          />
        ) : type === "number" ? (
          <Input
            type="number"
            min={1}
            max={10}
            value={form[field] as number}
            onChange={(e) => setForm((f) => ({ ...f, [field]: parseInt(e.target.value) || 1 }))}
          />
        ) : (
          <Input
            value={form[field] as string}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          />
        )
      ) : (
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{String(form[field])}</p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Mentor Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusBadge(application.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status messages */}
        {application.status === "rejected" && application.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800"><strong>Reason:</strong> {application.rejection_reason}</p>
          </div>
        )}
        {application.status === "approved" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Your mentor profile is active. You can now be matched with mentees.</p>
          </div>
        )}
        {application.status === "pending" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">Your application is being reviewed by an administrator.</p>
          </div>
        )}

        {/* Summary row */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{application.title} {application.full_name}</span>
            <span className="text-muted-foreground"> &middot; {application.organization}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {expanded ? "Less" : "View Details"}
          </Button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-5 pt-2 border-t">
            {/* Actions */}
            <div className="flex justify-end gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                    <X className="h-4 w-4 mr-1" />Cancel
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />Edit
                </Button>
              )}
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" field="title" />
                <Field label="Full Name" field="full_name" />
                <Field label="Organization" field="organization" />
                <Field label="Division" field="division" />
                <Field label="Work Email" field="work_email" />
                <Field label="Work Phone" field="work_phone" />
              </div>
            </div>

            {/* Experience & Skillset */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Experience & Skillset</h4>
              <div className="space-y-3">
                <Field label="Positions Held" field="positions_held" type="textarea" />
                <Field label="General Competencies" field="general_competencies" type="textarea" />
                <Field label="Technical Competencies" field="technical_competencies" type="textarea" />
              </div>
            </div>

            {/* Mentorship Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Mentorship Details</h4>
              <div className="space-y-3">
                <Field label="Why do you want to mentor?" field="why_mentor" type="textarea" />
                <Field label="Maximum Mentees" field="max_mentees" type="number" />
                <Field label="What can a mentee learn from you?" field="what_can_mentee_learn" type="textarea" />
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span>Submitted: {new Date(application.created_at).toLocaleDateString()}</span>
              {application.reviewed_at && (
                <span>Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
