"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPost } from "@/lib/api";
import type { Event, EventTicket } from "@/types/events";
import { MEETING_PLATFORMS } from "@/types/events";
import { downloadICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/calendar-export";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Video,
  Globe,
  Users,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Share2,
  Download,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, isPast, isFuture, formatDistanceToNow } from "date-fns";

const EventMap = dynamic(() => import("@/components/EventMap"), { ssr: false });

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isAuthenticated } = useAuth();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);

  // Registration form
  const [regForm, setRegForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    ticket_id: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const { event: data, tickets: ticketData } = await apiGet<{
          event: Record<string, unknown>;
          tickets: EventTicket[];
        }>(`/api/public/events/${slug}`);

        const mapped = {
          ...data,
          _registration_count:
            (data.event_registrations as { count: number }[])?.[0]?.count || 0,
        } as Event;
        setEvent(mapped);
        setTickets(ticketData);

        // Check if already registered (user-specific, needs auth)
        if (user) {
          const { data: regData } = await supabase
            .from("event_registrations")
            .select("id")
            .eq("event_id", data.id as string)
            .eq("user_id", user.id)
            .eq("status", "confirmed")
            .maybeSingle();
          setAlreadyRegistered(!!regData);
        }
      } catch {
        router.replace("/events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user]);

  // Pre-fill reg form from profile
  useEffect(() => {
    if (profile) {
      setRegForm((f) => ({ ...f, full_name: profile.full_name || "" }));
    }
    if (user) {
      setRegForm((f) => ({ ...f, email: user.email || "" }));
    }
  }, [profile, user]);

  // Set default ticket
  useEffect(() => {
    if (tickets.length > 0 && !regForm.ticket_id) {
      setRegForm((f) => ({ ...f, ticket_id: tickets[0].id }));
    }
  }, [tickets, regForm.ticket_id]);

  const handleRegister = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${slug}`);
      return;
    }
    if (!event) return;
    if (!regForm.full_name.trim() || !regForm.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }

    setRegistering(true);
    try {
      await apiPost("/api/user/event-register", {
        event_id: event.id,
        ticket_id: regForm.ticket_id || null,
        full_name: regForm.full_name,
        email: regForm.email,
        phone: regForm.phone || null,
      });
      setAlreadyRegistered(true);
      setShowRegForm(false);
      toast({ title: "Registration confirmed!", description: "You have been registered for this event." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      if (message.includes("already")) {
        toast({ title: "Already registered", description: "You are already registered for this event.", variant: "destructive" });
      } else {
        toast({ title: "Registration failed", description: message, variant: "destructive" });
      }
    } finally {
      setRegistering(false);
    }
  };

  const copyMeetingLink = () => {
    if (event?.meeting_url) {
      navigator.clipboard.writeText(event.meeting_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (!event) return null;

  const isUpcoming = isFuture(new Date(event.start_date));
  const isOngoing =
    isPast(new Date(event.start_date)) && isFuture(new Date(event.end_date));
  const eventEnded = isPast(new Date(event.end_date));
  const spotsLeft =
    event.capacity != null ? event.capacity - (event._registration_count || 0) : null;
  const canRegister =
    event.is_registration_open &&
    !eventEnded &&
    !alreadyRegistered &&
    (spotsLeft === null || spotsLeft > 0) &&
    (!event.registration_deadline || isFuture(new Date(event.registration_deadline)));

  const platformLabel =
    MEETING_PLATFORMS.find((p) => p.value === event.meeting_platform)?.label ||
    event.meeting_platform;

  const hasLocation = event.event_type === "in-person" || event.event_type === "hybrid";
  const hasOnline = event.event_type === "online" || event.event_type === "hybrid";
  const hasMap = hasLocation && event.latitude && event.longitude;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20">
        {/* Hero Image */}
        <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-green-600 to-green-800">
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill className="object-cover opacity-60" />
          ) : null}
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-8">
              <Link
                href="/events"
                className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Events
              </Link>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  {event.event_type === "in-person" ? (
                    <><MapPin className="h-3 w-3 mr-1" /> In-Person</>
                  ) : event.event_type === "online" ? (
                    <><Video className="h-3 w-3 mr-1" /> Online</>
                  ) : (
                    <><Globe className="h-3 w-3 mr-1" /> Hybrid</>
                  )}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 capitalize">
                  {event.category.replace("-", " ")}
                </Badge>
                {isOngoing && <Badge className="bg-yellow-500 text-white">Happening Now</Badge>}
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date & Time */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-green-100 text-green-700 rounded-lg p-3 text-center min-w-[60px]">
                      <div className="text-xs font-medium uppercase">
                        {format(new Date(event.start_date), "MMM")}
                      </div>
                      <div className="text-2xl font-bold">
                        {format(new Date(event.start_date), "d")}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {format(new Date(event.start_date), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(event.start_date), "h:mm a")} –{" "}
                        {format(new Date(event.end_date), "h:mm a")}
                        <span className="text-gray-400 ml-1">({event.timezone})</span>
                      </p>
                      {isUpcoming && (
                        <p className="text-sm text-green-600 mt-1">
                          Starts {formatDistanceToNow(new Date(event.start_date), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              {hasLocation && (event.venue_name || event.address) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-green-600" /> Venue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.venue_name && (
                      <p className="font-medium text-gray-900">{event.venue_name}</p>
                    )}
                    {event.address && (
                      <p className="text-sm text-gray-600">
                        {[event.address, event.city, event.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {hasMap && (
                      <EventMap
                        latitude={event.latitude!}
                        longitude={event.longitude!}
                        venueName={event.venue_name || undefined}
                        address={event.address || undefined}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Online Meeting Details */}
              {hasOnline && event.meeting_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Video className="h-4 w-4 text-green-600" /> Online Meeting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {platformLabel && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Platform:</span>
                        <Badge variant="secondary" className="capitalize">{platformLabel}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Link:</span>
                      <a
                        href={event.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-800 underline flex items-center gap-1 truncate max-w-xs"
                      >
                        {event.meeting_url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      <button
                        onClick={copyMeetingLink}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy link"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    {event.meeting_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Meeting ID:</span>
                        <span className="text-sm text-gray-700 font-mono">{event.meeting_id}</span>
                      </div>
                    )}
                    {event.meeting_passcode && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Passcode:</span>
                        <span className="text-sm text-gray-700 font-mono">{event.meeting_passcode}</span>
                      </div>
                    )}
                    {!alreadyRegistered && isUpcoming && (
                      <p className="text-xs text-muted-foreground italic">
                        Register to get full meeting access details.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  {event.description ? (
                    <div
                      className="prose prose-green max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  ) : (
                    <p className="text-muted-foreground">{event.short_description}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base">Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  {eventEnded ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium text-gray-600">This event has ended</p>
                    </div>
                  ) : alreadyRegistered ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700">You&apos;re registered!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We look forward to seeing you there.
                      </p>
                    </div>
                  ) : spotsLeft !== null && spotsLeft <= 0 ? (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="font-medium text-red-600">Sold Out</p>
                    </div>
                  ) : !event.is_registration_open ? (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="font-medium text-gray-600">Registration closed</p>
                    </div>
                  ) : showRegForm ? (
                    /* Registration Form */
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name</Label>
                        <Input
                          value={regForm.full_name}
                          onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          value={regForm.email}
                          onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone (optional)</Label>
                        <Input
                          type="tel"
                          value={regForm.phone}
                          onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+233..."
                        />
                      </div>
                      {tickets.length > 1 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Ticket Type</Label>
                          <select
                            value={regForm.ticket_id}
                            onChange={(e) => setRegForm((f) => ({ ...f, ticket_id: e.target.value }))}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                          >
                            {tickets.map((t) => (
                              <option key={t.id} value={t.id} disabled={t.sold >= t.quantity}>
                                {t.name}
                                {t.description ? ` – ${t.description}` : ""}
                                {t.sold >= t.quantity ? " (Full)" : ` (${t.quantity - t.sold} left)`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRegister}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={registering}
                        >
                          {registering ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Confirm Registration"
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setShowRegForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Register Button */
                    <div className="space-y-3">
                      {spotsLeft !== null && (
                        <div className="text-center">
                          <span className={`text-sm font-medium ${spotsLeft <= 10 ? "text-red-600" : "text-gray-600"}`}>
                            {spotsLeft} spots remaining
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  ((event._registration_count || 0) / event.capacity!) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {event.registration_deadline && (
                        <p className="text-xs text-muted-foreground text-center">
                          Deadline: {format(new Date(event.registration_deadline), "MMM d, yyyy h:mm a")}
                        </p>
                      )}
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            router.push(`/login?redirect=/events/${slug}`);
                          } else {
                            setShowRegForm(true);
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!canRegister}
                      >
                        {isAuthenticated ? "Register Now" : "Sign In to Register"}
                      </Button>
                    </div>
                  )}

                  {/* Calendar Export */}
                  {!eventEnded && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Add to Calendar</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadICS(event)}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" /> iCal / Outlook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getGoogleCalendarUrl(event), "_blank")}
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" /> Google
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getOutlookCalendarUrl(event), "_blank")}
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" /> Outlook Web
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Share */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Share Event</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied!" });
                      }}
                    >
                      <Share2 className="h-3 w-3 mr-1" /> Copy Link
                    </Button>
                  </div>
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
