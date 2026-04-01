"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { Event } from "@/types/events";
import { EVENT_CATEGORIES } from "@/types/events";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Video,
  Globe,
  Users,
  Clock,
  Filter,
  Loader2,
} from "lucide-react";
import { format, isPast, isFuture } from "date-fns";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { events: data } = await apiGet<{ events: Record<string, unknown>[] }>("/api/public/events");
        const mapped = data.map((e) => ({
          ...e,
          _registration_count:
            (e.event_registrations as { count: number }[])?.[0]?.count || 0,
        })) as Event[];
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((event) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !event.title.toLowerCase().includes(q) &&
        !event.short_description.toLowerCase().includes(q) &&
        !event.category.toLowerCase().includes(q) &&
        !(event.city || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (categoryFilter !== "all" && event.category !== categoryFilter) return false;
    if (typeFilter !== "all" && event.event_type !== typeFilter) return false;
    if (dateFilter === "upcoming" && isPast(new Date(event.end_date))) return false;
    if (dateFilter === "past" && isFuture(new Date(event.start_date))) return false;
    return true;
  });

  const featuredEvents = filtered.filter((e) => e.is_featured);
  const regularEvents = filtered.filter((e) => !e.is_featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Events</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Discover workshops, seminars, networking events, and more from EIM Consult.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Date Filter */}
              <div className="flex rounded-lg border overflow-hidden">
                {(["upcoming", "past", "all"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDateFilter(d)}
                    className={`px-3 py-2 text-sm capitalize ${
                      dateFilter === d
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Types</option>
                <option value="in-person">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Categories</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No events found</h3>
              <p className="text-muted-foreground mt-1">
                {search || categoryFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Check back soon for upcoming events!"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Events */}
              {featuredEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {featuredEvents.map((event) => (
                      <EventCard key={event.id} event={event} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Events */}
              {regularEvents.length > 0 && (
                <div>
                  {featuredEvents.length > 0 && (
                    <h2 className="text-xl font-bold text-gray-900 mb-4">All Events</h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {regularEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const isUpcoming = isFuture(new Date(event.start_date));
  const spotsLeft =
    event.capacity != null ? event.capacity - (event._registration_count || 0) : null;

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow h-full ${featured ? "border-green-200 border-2" : ""}`}>
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-green-300" />
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-700 text-xs">
              {event.event_type === "in-person" ? (
                <><MapPin className="h-3 w-3 mr-1" /> In-Person</>
              ) : event.event_type === "online" ? (
                <><Video className="h-3 w-3 mr-1" /> Online</>
              ) : (
                <><Globe className="h-3 w-3 mr-1" /> Hybrid</>
              )}
            </Badge>
          </div>
          {featured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-yellow-400 text-yellow-900 text-xs">Featured</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
            <Calendar className="h-4 w-4" />
            {format(new Date(event.start_date), "EEE, MMM d, yyyy")}
            <span className="text-gray-400">|</span>
            {format(new Date(event.start_date), "h:mm a")}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
            {event.title}
          </h3>

          {/* Short desc */}
          {event.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.short_description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
            {(event.venue_name || event.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.venue_name || event.city}
              </span>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {event.category.replace("-", " ")}
            </Badge>
          </div>

          {/* Status / Capacity */}
          <div className="flex items-center justify-between pt-2 border-t">
            {spotsLeft !== null ? (
              <span className={`text-xs font-medium ${spotsLeft <= 5 ? "text-red-600" : "text-gray-600"}`}>
                {spotsLeft <= 0 ? "Sold Out" : `${spotsLeft} spots left`}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Open registration</span>
            )}
            {isUpcoming ? (
              <Badge variant="success" className="text-xs">Upcoming</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Past</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
