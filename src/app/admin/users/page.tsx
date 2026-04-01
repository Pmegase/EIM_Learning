"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPut, apiPost, apiDelete } from "@/lib/api";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import Image from "next/image";
import type { UserRole } from "@/types";
import {
  Loader2, LayoutDashboard, LogOut, Briefcase, Users, Search,
  ChevronLeft, ChevronRight, ShieldCheck, GraduationCap, Building,
  Ban, CheckCircle, Trash2, KeyRound, ChevronDown, ChevronUp,
  Mail, MapPin, Calendar, Eye, Download,
} from "lucide-react";

interface UserWithEmail {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_suspended: boolean;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  university: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  suspended: number;
  interns: number;
  mentors: number;
  corporate: number;
  admins: number;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin", icon: <ShieldCheck className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
  mentor: { label: "Mentor", icon: <Users className="h-3 w-3" />, color: "bg-blue-100 text-blue-700" },
  corporate: { label: "Corporate", icon: <Building className="h-3 w-3" />, color: "bg-amber-100 text-amber-700" },
  intern: { label: "Student", icon: <GraduationCap className="h-3 w-3" />, color: "bg-green-100 text-green-700" },
  alumni: { label: "Alumni", icon: <GraduationCap className="h-3 w-3" />, color: "bg-teal-100 text-teal-700" },
};

const ROLES: UserRole[] = ["admin", "mentor", "corporate", "intern", "alumni"];
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, role, isLoading: authLoading, logout, profile } = useAuth();

  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, suspended: 0, interns: 0, mentors: 0, corporate: 0, admins: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const data = await apiGet<{ users: UserWithEmail[]; total: number; stats: Stats }>(
        `/api/admin/users?${params.toString()}`
      );
      setUsers(data.users);
      setTotal(data.total);
      setStats(data.stats);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { if (isAuthenticated && role === "admin") fetchUsers(); }, [isAuthenticated, role, fetchUsers]);
  useEffect(() => { if (!authLoading && (!isAuthenticated || role !== "admin")) router.replace("/login"); }, [authLoading, isAuthenticated, role, router]);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

  const handleUpdate = async (userId: string, updates: Record<string, unknown>, successMsg: string) => {
    setUpdatingId(userId);
    try {
      await apiPut(`/api/admin/users/${userId}`, updates);
      toast({ title: successMsg });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setUpdatingId(userId);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      toast({ title: `${name} deleted` });
      fetchUsers();
    } catch (err: unknown) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleResetPassword = async (userId: string) => {
    setUpdatingId(userId);
    try {
      const data = await apiPost<{ email: string }>(`/api/admin/users/${userId}/reset-password`, {});
      toast({ title: "Password reset sent", description: `Reset email sent to ${data.email}` });
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">User Management</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Button>
              <Button onClick={() => router.push("/admin/jobs")} variant="outline" size="sm"><Briefcase className="h-4 w-4 mr-1" />Jobs</Button>
              <Button onClick={logout} variant="outline" size="sm"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total Users", value: stats.total, color: "bg-gray-100" },
            { label: "Students", value: stats.interns, color: "bg-green-100" },
            { label: "Mentors", value: stats.mentors, color: "bg-blue-100" },
            { label: "Corporate", value: stats.corporate, color: "bg-amber-100" },
            { label: "Admins", value: stats.admins, color: "bg-purple-100" },
            { label: "Suspended", value: stats.suspended, color: "bg-red-100" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{s.value ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {[{ v: "", l: "All Roles" }, ...ROLES.map((r) => ({ v: r, l: ROLE_CONFIG[r]?.label || r }))].map((f) => (
              <button key={f.v} onClick={() => setRoleFilter(f.v)} className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${roleFilter === f.v ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {[{ v: "", l: "All" }, { v: "active", l: "Active" }, { v: "suspended", l: "Suspended" }].map((f) => (
              <button key={f.v} onClick={() => setStatusFilter(f.v)} className={`px-3 py-2 text-xs font-medium transition-colors ${statusFilter === f.v ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                {f.l}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => {
              const link = document.createElement("a");
              link.href = "/api/admin/users/export";
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-1" />Export Excel
          </Button>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
        ) : users.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No users found.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.intern;
              const isExpanded = expandedId === u.user_id;
              const isUpdating = updatingId === u.user_id;

              return (
                <Card key={u.user_id} className={u.is_suspended ? "border-red-200 bg-red-50/30" : ""}>
                  <CardContent className="p-0">
                    {/* Header row */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : u.user_id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar avatarUrl={u.avatar_url} size="sm" fallbackColor="green" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{u.full_name}</p>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${rc.color}`}>
                              {rc.icon}{rc.label}
                            </span>
                            {u.is_suspended && <Badge variant="destructive" className="text-[10px]"><Ban className="h-2.5 w-2.5 mr-0.5" />Suspended</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 hidden sm:block">{new Date(u.created_at).toLocaleDateString()}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
                        {/* Info */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                          {u.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.location}</span>}
                          {u.university && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{u.university}</span>}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                        {u.headline && <p className="text-sm text-gray-600">{u.headline}</p>}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {/* Role change */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Role:</span>
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdate(u.user_id, { role: e.target.value }, `Role changed to ${e.target.value}`)}
                              className="border rounded px-2 py-1 text-xs"
                              disabled={isUpdating || u.user_id === profile?.user_id}
                            >
                              {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
                            </select>
                          </div>

                          {/* Suspend / Activate */}
                          {u.user_id !== profile?.user_id && (
                            u.is_suspended ? (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdate(u.user_id, { is_suspended: false }, `${u.full_name} reactivated`)} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                Activate
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleUpdate(u.user_id, { is_suspended: true }, `${u.full_name} suspended`)} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                                Suspend
                              </Button>
                            )
                          )}

                          {/* Reset Password */}
                          <Button size="sm" variant="outline" onClick={() => handleResetPassword(u.user_id)} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <KeyRound className="h-3 w-3 mr-1" />}
                            Reset Password
                          </Button>

                          {/* Delete */}
                          {u.user_id !== profile?.user_id && (
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(u.user_id, u.full_name)} disabled={isUpdating}>
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} users)</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
