"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { mentorshipRequestSchema } from "@/lib/validations";
import type { MentorApplication } from "@/types";
import type { Mentorship } from "@/types/jobs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ArrowLeft, User, Briefcase, Award, Heart, Users, Mail, Phone,
  Loader2, CheckCircle, Send, Building, Globe,
} from "lucide-react";

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated } = useAuth();
  const [mentor, setMentor] = useState<MentorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [existingRequest, setExistingRequest] = useState<Mentorship | null>(null);
  const [activeMenteeCount, setActiveMenteeCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    message: "",
    goals: "",
    preferred_schedule: "",
  });

  useEffect(() => {
    const fetchMentor = async () => {
      setLoading(true);
      try {
        const { mentor: data, menteeCount } = await apiGet<{
          mentor: MentorApplication;
          menteeCount: number;
        }>(`/api/public/mentors/${id}`);
        setMentor(data);
        setActiveMenteeCount(menteeCount);

        // Check if current user already requested
        if (user) {
          try {
            const { mentorship } = await apiGet<{ mentorship: Mentorship | null }>(
              `/api/user/mentorship-check?mentor_id=${id}`
            );
            if (mentorship) setExistingRequest(mentorship);
          } catch {
            // not logged in or no existing request
          }
        }
      } catch {
        router.replace("/mentors");
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleRequest = async () => {
    setErrors({});
    const result = mentorshipRequestSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    if (!user || !mentor) return;

    setSending(true);
    try {
      await apiPost("/api/user/mentorship-request", {
        mentor_id: mentor.user_id,
        message: form.message,
        goals: form.goals,
        preferred_schedule: form.preferred_schedule || null,
      });
      setExistingRequest({ status: "pending" } as Mentorship);
      setShowForm(false);
      toast({ title: "Request sent!", description: "The mentor will review your request." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      if (message.includes("already")) {
        toast({ title: "Request already sent", variant: "destructive" });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center pt-32 pb-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }
  if (!mentor) return null;

  const spotsLeft = mentor.max_mentees - activeMenteeCount;
  const canRequest = !existingRequest && spotsLeft > 0 && (!user || user.id !== mentor.user_id);

  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    pending: { label: "Request Pending", variant: "warning" },
    active: { label: "Active Mentorship", variant: "success" },
    completed: { label: "Completed", variant: "secondary" },
    declined: { label: "Declined", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "secondary" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <Link href="/mentors" className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Mentors
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {mentor.profiles?.avatar_url ? (
                        <img src={mentor.profiles.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{mentor.title} {mentor.full_name}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Building className="h-4 w-4" />{mentor.organization}</span>
                        <span>{mentor.division}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="success"><Users className="h-3 w-3 mr-1" />Accepts {mentor.max_mentees} mentee{mentor.max_mentees > 1 ? "s" : ""}</Badge>
                        {spotsLeft > 0 ? (
                          <Badge variant="outline">{spotsLeft} spot{spotsLeft > 1 ? "s" : ""} available</Badge>
                        ) : (
                          <Badge variant="destructive">Fully booked</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-green-600" />Positions & Grades Held</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{mentor.positions_held}</p></CardContent>
              </Card>

              {/* Competencies */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-green-600" />Strongest General Competencies</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{mentor.general_competencies}</p></CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-green-600" />Strongest Technical Competencies</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{mentor.technical_competencies}</p></CardContent>
              </Card>

              {/* Why Mentor */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-green-600" />Why They Mentor</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{mentor.why_mentor}</p></CardContent>
              </Card>

              {/* What You Can Learn */}
              <Card>
                <CardHeader><CardTitle className="text-base">What You Can Learn</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-700 whitespace-pre-wrap">{mentor.what_can_mentee_learn}</p></CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">Request Mentorship</h3>

                  {/* Contact info */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{mentor.work_email}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{mentor.work_phone}</div>
                  </div>

                  {existingRequest ? (
                    <div className="text-center py-3">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <Badge variant={statusMap[existingRequest.status]?.variant || "secondary"}>
                        {statusMap[existingRequest.status]?.label || existingRequest.status}
                      </Badge>
                    </div>
                  ) : showForm ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Message to Mentor</Label>
                        <Textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Introduce yourself and why you'd like this mentor..." />
                        {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Your Mentorship Goals</Label>
                        <Textarea rows={3} value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} placeholder="What do you hope to achieve?" />
                        {errors.goals && <p className="text-xs text-red-500">{errors.goals}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Preferred Schedule (optional)</Label>
                        <Input value={form.preferred_schedule} onChange={(e) => setForm((f) => ({ ...f, preferred_schedule: e.target.value }))} placeholder="e.g. Weekday evenings, Saturday mornings" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleRequest} className="flex-1 bg-green-600 hover:bg-green-700" disabled={sending}>
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Send Request</>}
                        </Button>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!canRequest}
                      onClick={() => {
                        if (!isAuthenticated) router.push(`/login?redirect=/mentors/${id}`);
                        else setShowForm(true);
                      }}
                    >
                      {spotsLeft <= 0 ? "Fully Booked" : isAuthenticated ? "Request Mentorship" : "Sign In to Request"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
