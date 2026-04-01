"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type {
  Event,
  EventTicket,
  EventRegistration,
  EventType,
  EventStatus,
  MeetingPlatform,
} from "@/types/events";
import { EVENT_CATEGORIES, MEETING_PLATFORMS } from "@/types/events";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Pencil,
  Eye,
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  LayoutDashboard,
  LogOut,
  Globe,
  Copy,
  Upload,
} from "lucide-react";
import { uploadFile } from "@/lib/storage";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type AdminView = "list" | "form" | "attendees";

export default function AdminEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated, role, isLoading: authLoading, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<AdminView>("list");
  const [uploading, setUploading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    short_description: "",
    description: "",
    event_type: "in-person" as EventType,
    category: "general",
    start_date: "",
    end_date: "",
    timezone: "Africa/Accra",
    venue_name: "",
    address: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    meeting_url: "",
    meeting_platform: "" as MeetingPlatform | "",
    meeting_id: "",
    meeting_passcode: "",
    capacity: "",
    registration_deadline: "",
    is_registration_open: true,
    image_url: "",
    status: "draft" as EventStatus,
    is_featured: false,
  });

  // Tickets state
  const [tickets, setTickets] = useState<
    { name: string; description: string; quantity: string; id?: string }[]
  >([{ name: "General Admission", description: "", quantity: "100" }]);

  // Attendees state
  const [attendees, setAttendeesState] = useState<EventRegistration[]>([]);
  const [attendeesEvent, setAttendeesEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { events: data } = await apiGet<{ events: Event[] }>("/api/admin/events");
      setEvents(data || []);
    } catch {
      // silently fail, list stays empty
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === "admin") fetchEvents();
  }, [isAuthenticated, role, fetchEvents]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== "admin")) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, role, router]);

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      short_description: "",
      description: "",
      event_type: "in-person",
      category: "general",
      start_date: "",
      end_date: "",
      timezone: "Africa/Accra",
      venue_name: "",
      address: "",
      city: "",
      country: "",
      latitude: "",
      longitude: "",
      meeting_url: "",
      meeting_platform: "",
      meeting_id: "",
      meeting_passcode: "",
      capacity: "",
      registration_deadline: "",
      is_registration_open: true,
      image_url: "",
      status: "draft",
      is_featured: false,
    });
    setTickets([{ name: "General Admission", description: "", quantity: "100" }]);
    setEditingEvent(null);
  };

  const openCreateForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = async (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      slug: event.slug,
      short_description: event.short_description,
      description: event.description,
      event_type: event.event_type,
      category: event.category,
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
      timezone: event.timezone,
      venue_name: event.venue_name || "",
      address: event.address || "",
      city: event.city || "",
      country: event.country || "",
      latitude: event.latitude?.toString() || "",
      longitude: event.longitude?.toString() || "",
      meeting_url: event.meeting_url || "",
      meeting_platform: (event.meeting_platform as MeetingPlatform) || "",
      meeting_id: event.meeting_id || "",
      meeting_passcode: event.meeting_passcode || "",
      capacity: event.capacity?.toString() || "",
      registration_deadline: event.registration_deadline
        ? new Date(event.registration_deadline).toISOString().slice(0, 16)
        : "",
      is_registration_open: event.is_registration_open,
      image_url: event.image_url || "",
      status: event.status,
      is_featured: event.is_featured,
    });

    // Fetch tickets
    try {
      const { tickets: ticketData } = await apiGet<{ tickets: EventTicket[] }>(`/api/admin/events/${event.id}/tickets`);
      if (ticketData && ticketData.length > 0) {
        setTickets(
          ticketData.map((t: EventTicket) => ({
            id: t.id,
            name: t.name,
            description: t.description || "",
            quantity: t.quantity.toString(),
          }))
        );
      } else {
        setTickets([{ name: "General Admission", description: "", quantity: "100" }]);
      }
    } catch {
      setTickets([{ name: "General Admission", description: "", quantity: "100" }]);
    }

    setView("form");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!form.start_date || !form.end_date) {
      toast({ title: "Start and end dates are required", variant: "destructive" });
      return;
    }

    setSaving(true);

    const eventData = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      short_description: form.short_description,
      description: form.description,
      event_type: form.event_type,
      category: form.category,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      timezone: form.timezone,
      venue_name: form.venue_name || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      meeting_url: form.meeting_url || null,
      meeting_platform: form.meeting_platform || null,
      meeting_id: form.meeting_id || null,
      meeting_passcode: form.meeting_passcode || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      registration_deadline: form.registration_deadline
        ? new Date(form.registration_deadline).toISOString()
        : null,
      is_registration_open: form.is_registration_open,
      image_url: form.image_url || null,
      status: form.status,
      is_featured: form.is_featured,
      created_by: user?.id,
    };

    let eventId = editingEvent?.id;

    try {
      if (editingEvent) {
        await apiPut(`/api/admin/events/${editingEvent.id}`, eventData);
      } else {
        const result = await apiPost<{ event: { id: string } }>("/api/admin/events", eventData);
        eventId = result.event.id;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: editingEvent ? "Error updating event" : "Error creating event", description: message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Save tickets via API
    if (eventId) {
      try {
        await apiPut(`/api/admin/events/${eventId}/tickets`, { tickets });
      } catch {
        toast({ title: "Warning", description: "Event saved but tickets may not have been updated.", variant: "destructive" });
      }
    }

    toast({
      title: editingEvent ? "Event updated" : "Event created",
      description: `"${form.title}" has been ${editingEvent ? "updated" : "created"}.`,
    });

    setSaving(false);
    resetForm();
    setView("list");
    fetchEvents();
  };

  const handleDelete = async (event: Event) => {
    try {
      await apiDelete(`/api/admin/events/${event.id}`);
      toast({ title: "Event deleted" });
      fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openAttendees = async (event: Event) => {
    setAttendeesEvent(event);
    try {
      const { attendees: data } = await apiGet<{ attendees: EventRegistration[] }>(`/api/admin/events/${event.id}/attendees`);
      setAttendeesState(data || []);
    } catch {
      setAttendeesState([]);
    }
    setView("attendees");
  };

  const toggleCheckIn = async (reg: EventRegistration) => {
    if (!attendeesEvent) return;
    const newVal = !reg.checked_in;
    try {
      await apiPut(`/api/admin/events/${attendeesEvent.id}/attendees`, {
        registrationId: reg.id,
        checked_in: newVal,
      });
      setAttendeesState((prev) =>
        prev.map((r) =>
          r.id === reg.id
            ? { ...r, checked_in: newVal, checked_in_at: newVal ? new Date().toISOString() : null }
            : r
        )
      );
      toast({ title: newVal ? "Checked in" : "Check-in removed" });
    } catch {
      toast({ title: "Error updating check-in", variant: "destructive" });
    }
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const showsOnlineFields = form.event_type === "online" || form.event_type === "hybrid";
  const showsLocationFields = form.event_type === "in-person" || form.event_type === "hybrid";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <div className="flex items-center">
              <Image src="/uploads/hero-bg.png" alt="EIM" width={48} height={48} className="h-10 sm:h-12 w-auto mr-3" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Event Management</h1>
                {profile?.full_name && <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => router.push("/admin/dashboard")} variant="outline" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
              </Button>
              <Button onClick={() => router.push("/admin/users")} variant="outline" size="sm">Users</Button>
              <Button onClick={() => router.push("/")} variant="outline" size="sm">Website</Button>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* LIST VIEW */}
        {view === "list" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={openCreateForm} className="bg-green-600 hover:bg-green-700 shrink-0">
                <Plus className="h-4 w-4 mr-2" /> New Event
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {searchQuery ? "No events match your search." : "No events yet. Create your first event!"}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                            <Badge
                              variant={
                                event.status === "published"
                                  ? "success"
                                  : event.status === "cancelled"
                                    ? "destructive"
                                    : "warning"
                              }
                              className="text-xs"
                            >
                              {event.status}
                            </Badge>
                            {event.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                            <Badge variant="outline" className="text-xs capitalize">
                              {event.event_type === "in-person" ? (
                                <><MapPin className="h-3 w-3 mr-1" /> In-Person</>
                              ) : event.event_type === "online" ? (
                                <><Video className="h-3 w-3 mr-1" /> Online</>
                              ) : (
                                <><Globe className="h-3 w-3 mr-1" /> Hybrid</>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.start_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="capitalize">{event.category}</span>
                            {event.capacity && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {(event._registration_count || 0)}/{event.capacity}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAttendees(event)}
                            title="View attendees"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/events/${event.slug}`, "_blank")}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditForm(event)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(event)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Button variant="outline" onClick={() => { resetForm(); setView("list"); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h2 className="text-lg font-bold">{editingEvent ? "Edit Event" : "Create New Event"}</h2>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="location">Location / Online</TabsTrigger>
                <TabsTrigger value="details">Details & Media</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={form.title}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              title: e.target.value,
                              slug: editingEvent ? f.slug : generateSlug(e.target.value),
                            }))
                          }
                          placeholder="Event title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          placeholder="url-slug"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Short Description</Label>
                      <Textarea
                        value={form.short_description}
                        onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                        rows={2}
                        placeholder="Brief summary for listing cards"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <select
                          value={form.event_type}
                          onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value as EventType }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="in-person">In-Person</option>
                          <option value="online">Online</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {EVENT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EventStatus }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={form.start_date}
                          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={form.end_date}
                          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Capacity (leave empty for unlimited)</Label>
                        <Input
                          type="number"
                          value={form.capacity}
                          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                          placeholder="e.g. 200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration Deadline</Label>
                        <Input
                          type="datetime-local"
                          value={form.registration_deadline}
                          onChange={(e) => setForm((f) => ({ ...f, registration_deadline: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 flex flex-col">
                        <Label>Options</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.is_registration_open}
                              onChange={(e) => setForm((f) => ({ ...f, is_registration_open: e.target.checked }))}
                            />
                            Registration Open
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.is_featured}
                              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                            />
                            Featured
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location / Online Tab */}
              <TabsContent value="location">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {showsLocationFields && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" /> Venue Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Venue Name</Label>
                            <Input
                              value={form.venue_name}
                              onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                              placeholder="e.g. Accra International Conference Centre"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                              value={form.address}
                              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                              placeholder="Street address"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                              value={form.city}
                              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                              placeholder="e.g. Accra"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                              value={form.country}
                              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                              placeholder="e.g. Ghana"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                              type="number"
                              step="any"
                              value={form.latitude}
                              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                              placeholder="e.g. 5.6037"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                              type="number"
                              step="any"
                              value={form.longitude}
                              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                              placeholder="e.g. -0.1870"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tip: Find coordinates on{" "}
                          <a
                            href="https://www.openstreetmap.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 underline"
                          >
                            OpenStreetMap
                          </a>
                          . Right-click a location and copy coordinates.
                        </p>
                      </div>
                    )}

                    {showsOnlineFields && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Video className="h-4 w-4 text-green-600" /> Online Meeting Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Meeting Platform</Label>
                            <select
                              value={form.meeting_platform}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, meeting_platform: e.target.value as MeetingPlatform }))
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Select platform</option>
                              {MEETING_PLATFORMS.map((p) => (
                                <option key={p.value} value={p.value}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Meeting URL</Label>
                            <Input
                              value={form.meeting_url}
                              onChange={(e) => setForm((f) => ({ ...f, meeting_url: e.target.value }))}
                              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Meeting ID (optional)</Label>
                            <Input
                              value={form.meeting_id}
                              onChange={(e) => setForm((f) => ({ ...f, meeting_id: e.target.value }))}
                              placeholder="e.g. 123 456 7890"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Passcode (optional)</Label>
                            <Input
                              value={form.meeting_passcode}
                              onChange={(e) => setForm((f) => ({ ...f, meeting_passcode: e.target.value }))}
                              placeholder="Meeting passcode"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {form.event_type === "in-person" && (
                      <p className="text-sm text-muted-foreground italic">
                        This is an in-person event. Switch to &quot;Online&quot; or &quot;Hybrid&quot; to add meeting links.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details & Media Tab */}
              <TabsContent value="details">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.image_url}
                          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                          placeholder="URL or upload a file"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            const { url, error } = await uploadFile(file, "events");
                            setUploading(false);
                            if (url) {
                              setForm((f) => ({ ...f, image_url: url }));
                              toast({ title: "Cover image uploaded" });
                            } else {
                              toast({ title: "Upload failed", description: error || "Unknown error", variant: "destructive" });
                            }
                          }}
                          className="hidden"
                          id="event-cover-upload"
                        />
                        <label htmlFor="event-cover-upload">
                          <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Full Description (Rich Text)</Label>
                      <TipTapEditor
                        content={form.description}
                        onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                        placeholder="Write the full event description..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Ticket Types (Free)</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTickets((prev) => [...prev, { name: "", description: "", quantity: "50" }])
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Ticket Type
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tickets.map((ticket, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border rounded-lg p-3">
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={ticket.name}
                            onChange={(e) =>
                              setTickets((prev) =>
                                prev.map((t, idx) => (idx === i ? { ...t, name: e.target.value } : t))
                              )
                            }
                            placeholder="e.g. VIP, General"
                          />
                        </div>
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={ticket.description}
                            onChange={(e) =>
                              setTickets((prev) =>
                                prev.map((t, idx) => (idx === i ? { ...t, description: e.target.value } : t))
                              )
                            }
                            placeholder="Optional description"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) =>
                              setTickets((prev) =>
                                prev.map((t, idx) => (idx === i ? { ...t, quantity: e.target.value } : t))
                              )
                            }
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          {tickets.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setTickets((prev) => prev.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ATTENDEES VIEW */}
        {view === "attendees" && attendeesEvent && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setView("list")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Events
              </Button>
              <h2 className="text-lg font-bold">
                Attendees: {attendeesEvent.title}
              </h2>
              <Badge variant="secondary">{attendees.length} registered</Badge>
            </div>

            <Card>
              <CardContent className="pt-6">
                {attendees.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No registrations yet.</p>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm text-gray-700 min-w-[600px]">
                      <div className="col-span-3">Name</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Ticket</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Check-in</div>
                    </div>
                    {attendees.map((reg) => (
                      <div key={reg.id} className="grid grid-cols-12 gap-4 p-3 border rounded-lg items-center min-w-[600px]">
                        <div className="col-span-3 text-sm font-medium">{reg.full_name}</div>
                        <div className="col-span-3 text-sm text-gray-600">{reg.email}</div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {(reg.event_tickets as unknown as EventTicket)?.name || "—"}
                        </div>
                        <div className="col-span-2">
                          {reg.status === "confirmed" ? (
                            <Badge variant="success" className="text-xs">Confirmed</Badge>
                          ) : reg.status === "cancelled" ? (
                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">Waitlisted</Badge>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          <Button
                            variant={reg.checked_in ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCheckIn(reg)}
                            className={reg.checked_in ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {reg.checked_in ? (
                              <><CheckCircle className="h-4 w-4 mr-1" /> In</>
                            ) : (
                              "Check In"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
