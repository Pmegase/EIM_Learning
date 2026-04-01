"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import {
  Loader2, LayoutDashboard, LogOut, Users, FileText, Calendar,
  Briefcase, Mail, Heart, TrendingUp, Eye, UserCheck, Send,
  BarChart3,
} from "lucide-react";

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#84cc16"];

interface AnalyticsData {
  profiles: { role: string; created_at: string }[];
  posts: { status: string; category_name: string; view_count: number; published_at: string; created_at: string }[];
  events: { status: string; event_type: string; category: string; start_date: string; created_at: string }[];
  registrations: { status: string; checked_in: boolean; created_at: string }[];
  jobs: { status: string; job_type: string; experience_level: string; industry: string; is_remote: boolean; application_count: number; created_at: string }[];
  applications: { status: string; created_at: string }[];
  subscribers: { status: string; subscribed_at: string; created_at: string }[];
  campaigns: { status: string; total_recipients: number; total_delivered: number; total_opened: number; total_clicked: number; total_bounced: number; sent_at: string }[];
  mentorApps: { status: string; created_at: string }[];
  mentorships: { status: string; created_at: string }[];
}

function countBy<T>(arr: T[], key: keyof T): { name: string; value: number }[] {
  const map = new Map<string, number>();
  arr.forEach((item) => {
    const k = String(item[key] || "unknown");
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function monthlyGrowth(arr: { created_at?: string; subscribed_at?: string }[], dateKey = "created_at"): { month: string; count: number }[] {
  const map = new Map<string, number>();
  arr.forEach((item) => {
    const d = (item as Record<string, string>)[dateKey] || (item as Record<string, string>)["created_at"];
    if (!d) return;
    const month = new Date(d).toISOString().slice(0, 7);
    map.set(month, (map.get(month) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
}

function StatCard({ icon: Icon, label, value, sub, color = "text-green-600" }: { icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color.replace("text-", "bg-").replace("600", "100")}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, role, profile, isLoading: authLoading, logout } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== "admin")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, role, router]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await window.fetch("/api/admin/analytics");
        if (res.ok) setData(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    if (isAuthenticated && role === "admin") fetch();
  }, [isAuthenticated, role]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) return null;

  // Computed metrics
  const totalUsers = data.profiles.length;
  const totalPosts = data.posts.length;
  const publishedPosts = data.posts.filter((p) => p.status === "published").length;
  const totalViews = data.posts.reduce((s, p) => s + (p.view_count || 0), 0);
  const totalEvents = data.events.length;
  const totalRegistrations = data.registrations.length;
  const checkedIn = data.registrations.filter((r) => r.checked_in).length;
  const totalJobs = data.jobs.length;
  const publishedJobs = data.jobs.filter((j) => j.status === "published").length;
  const totalApplications = data.applications.length;
  const confirmedSubs = data.subscribers.filter((s) => s.status === "confirmed").length;
  const totalCampaignsSent = data.campaigns.filter((c) => c.status === "sent").length;
  const avgOpenRate = totalCampaignsSent > 0
    ? Math.round(data.campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + (c.total_delivered > 0 ? (c.total_opened / c.total_delivered) * 100 : 0), 0) / totalCampaignsSent)
    : 0;
  const approvedMentors = data.mentorApps.filter((m) => m.status === "approved").length;
  const activeMentorships = data.mentorships.filter((m) => m.status === "active").length;

  // Chart data
  const usersByRole = countBy(data.profiles, "role");
  const postsByCategory = countBy(data.posts.filter((p) => p.status === "published"), "category_name");
  const eventsByType = countBy(data.events, "event_type");
  const eventsByStatus = countBy(data.events, "status");
  const jobsByType = countBy(data.jobs, "job_type");
  const jobsByIndustry = countBy(data.jobs, "industry").slice(0, 8);
  const appsByStatus = countBy(data.applications, "status");
  const subsByStatus = countBy(data.subscribers, "status");
  const mentorAppsByStatus = countBy(data.mentorApps, "status");
  const mentorshipsByStatus = countBy(data.mentorships, "status");

  const userGrowth = monthlyGrowth(data.profiles);
  const subGrowth = monthlyGrowth(data.subscribers.filter((s) => s.status === "confirmed"), "subscribed_at");
  const regGrowth = monthlyGrowth(data.registrations);
  const appGrowth = monthlyGrowth(data.applications);

  // Campaign performance
  const campaignPerf = data.campaigns
    .filter((c) => c.status === "sent" && c.sent_at)
    .sort((a, b) => (a.sent_at || "").localeCompare(b.sent_at || ""))
    .slice(-10)
    .map((c, i) => ({
      name: `C${i + 1}`,
      delivered: c.total_delivered,
      opened: c.total_opened,
      clicked: c.total_clicked,
      bounced: c.total_bounced,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" /> Analytics
                </h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button onClick={() => router.push("/admin/users")} variant="outline" size="sm">
                Users
              </Button>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard icon={Users} label="Total Users" value={totalUsers} />
          <StatCard icon={FileText} label="Blog Posts" value={`${publishedPosts}/${totalPosts}`} sub={`${totalViews} views`} color="text-blue-600" />
          <StatCard icon={Calendar} label="Events" value={totalEvents} sub={`${totalRegistrations} registrations`} color="text-purple-600" />
          <StatCard icon={Briefcase} label="Jobs" value={`${publishedJobs}/${totalJobs}`} sub={`${totalApplications} applications`} color="text-orange-600" />
          <StatCard icon={Mail} label="Subscribers" value={confirmedSubs} sub={`${avgOpenRate}% avg open rate`} color="text-cyan-600" />
          <StatCard icon={Heart} label="Mentorships" value={activeMentorships} sub={`${approvedMentors} mentors`} color="text-pink-600" />
        </div>

        {/* Row 1: Users + Subscribers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Users by Role">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={usersByRole} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {usersByRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="User Growth (Monthly)">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: Blog + Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Posts by Category">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={postsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Newsletter Subscriber Growth">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={subGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0891b2" fill="#0891b2" fillOpacity={0.2} name="New Subscribers" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Newsletter Campaigns */}
        {campaignPerf.length > 0 && (
          <ChartCard title="Campaign Performance (Last 10)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignPerf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="delivered" fill="#16a34a" name="Delivered" radius={[2, 2, 0, 0]} />
                <Bar dataKey="opened" fill="#2563eb" name="Opened" radius={[2, 2, 0, 0]} />
                <Bar dataKey="clicked" fill="#d97706" name="Clicked" radius={[2, 2, 0, 0]} />
                <Bar dataKey="bounced" fill="#dc2626" name="Bounced" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Row 4: Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Events by Type">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={eventsByType} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {eventsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Events by Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={eventsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {eventsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Registrations (Monthly)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={regGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 5: Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Jobs by Type">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={jobsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Applications by Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={appsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {appsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Applications (Monthly)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={appGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#d97706" fill="#d97706" fillOpacity={0.2} name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 6: Mentorship */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Mentor Applications">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mentorAppsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {mentorAppsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Mentorships by Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mentorshipsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {mentorshipsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Subscriber Status">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={subsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {subsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Jobs by Industry */}
        {jobsByIndustry.length > 0 && (
          <ChartCard title="Jobs by Industry">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsByIndustry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </main>
    </div>
  );
}
