"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import type { MentorApplication } from "@/types";
import type { Company } from "@/types/jobs";
import CvCard from "@/components/dashboard/CvCard";
import CertificatesCard from "@/components/dashboard/CertificatesCard";
import MenteeCvList from "@/components/dashboard/MenteeCvList";
import MentorProfileCard from "@/components/dashboard/MentorProfileCard";
import MentorshipRequests from "@/components/dashboard/MentorshipRequests";
import StudentProfileCard from "@/components/dashboard/StudentProfileCard";
import MenteeChat from "@/components/dashboard/MenteeChat";
import CompanyProfileCard from "@/components/dashboard/CompanyProfileCard";
import CompanyApplications from "@/components/dashboard/CompanyApplications";
import MyApplications from "@/components/dashboard/MyApplications";
import CompanyJobs from "@/components/dashboard/CompanyJobs";
import AvatarUpload from "@/components/dashboard/AvatarUpload";
import DeleteAccount from "@/components/dashboard/DeleteAccount";
import UserGuide from "@/components/dashboard/UserGuide";
import {
  Loader2,
  LogOut,
  User,
  GraduationCap,
  Users,
  Building,
  ShieldCheck,
  FileText,
} from "lucide-react";

const roleIcons: Record<string, React.ReactNode> = {
  intern: <GraduationCap className="h-5 w-5" />,
  mentor: <Users className="h-5 w-5" />,
  corporate: <Building className="h-5 w-5" />,
  admin: <ShieldCheck className="h-5 w-5" />,
};

const roleLabels: Record<string, string> = {
  intern: "Intern / Student",
  mentor: "Mentor",
  corporate: "Corporate Partner",
  admin: "Administrator",
};

export default function DashboardPage() {
  const { user, profile, role, isLoading, logout } = useAuth();
  const [mentorApp, setMentorApp] = useState<MentorApplication | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const router = useRouter();

  // Fetch role-specific data in parallel once auth is ready
  useEffect(() => {
    if (!user || !role) return;

    if (role === "mentor") {
      apiGet<{ application: MentorApplication | null }>("/api/user/mentor-application")
        .then(({ application }) => setMentorApp(application))
        .catch(() => {});
    }

    if (role === "corporate") {
      apiGet<{ company: Company | null }>("/api/user/company")
        .then(({ company: data }) => setCompany(data))
        .catch(() => {})
        .finally(() => setCompanyLoading(false));
    } else {
      setCompanyLoading(false);
    }
  }, [user, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image
                src="/uploads/hero-bg.png"
                alt="EIM Consultancy"
                width={48}
                height={48}
                className="h-10 sm:h-12 w-auto mr-3"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Dashboard</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/")} variant="outline" size="sm">
                Website
              </Button>
              {role === "admin" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/dashboard">Admin</Link>
                </Button>
              )}
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Card */}
        {(role === "intern" || role === "alumni") ? (
          <StudentProfileCard profile={profile} email={user.email || ""} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <AvatarUpload avatarUrl={profile.avatar_url} size="md" editable />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{profile.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      {roleLabels[role || "intern"] || role}
                    </Badge>
                  </div>
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mentor Profile */}
        {role === "mentor" && (
          mentorApp ? (
            <MentorProfileCard
              application={mentorApp}
              onUpdate={(updated) => setMentorApp(updated)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Mentor Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You haven&apos;t submitted a mentor application yet.
                  </p>
                  <Button
                    onClick={() => router.push("/mentor-application")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Mentorship Requests (mentors) */}
        {role === "mentor" && <MentorshipRequests />}

        {/* Active Mentees (mentors) */}
        {role === "mentor" && <MenteeCvList />}

        {/* Mentor Chat (students) */}
        {(role === "intern" || role === "alumni") && <MenteeChat />}

        {/* CV Upload (students/alumni) */}
        {(role === "intern" || role === "alumni") && <CvCard />}

        {/* Certificates (students/alumni) */}
        {(role === "intern" || role === "alumni") && <CertificatesCard />}

        {/* My Applications (students/alumni) */}
        {(role === "intern" || role === "alumni") && <MyApplications />}

        {/* Corporate: Company Profile + Jobs */}
        {role === "corporate" && (
          companyLoading ? (
            <Card><CardContent className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></CardContent></Card>
          ) : !company ? (
            <Card>
              <CardContent className="py-8 text-center space-y-3">
                <Building className="h-10 w-10 text-gray-300 mx-auto" />
                <p className="text-sm font-medium text-gray-700">Set up your company profile</p>
                <p className="text-xs text-muted-foreground">Register your company to start posting jobs on the board.</p>
                <Button onClick={() => router.push("/company-setup")} className="bg-green-600 hover:bg-green-700">
                  <Building className="h-4 w-4 mr-2" />Set Up Company
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <CompanyProfileCard company={company} onUpdate={(c) => setCompany(c)} />
              <CompanyJobs companyApproved={company.status === "approved"} />
              {company.status === "approved" && <CompanyApplications />}
            </>
          )
        )}

        {/* User Guide */}
        {role && <UserGuide role={role} />}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Link
                href="/"
                className="p-3 border rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
              >
                Homepage
              </Link>
              <Link
                href="/blog"
                className="p-3 border rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                className="p-3 border rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
              >
                FAQ
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <DeleteAccount />
      </main>
    </div>
  );
}
