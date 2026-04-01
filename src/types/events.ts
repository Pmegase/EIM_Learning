export type EventType = "in-person" | "online" | "hybrid";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type MeetingPlatform = "zoom" | "google_meet" | "microsoft_teams" | "webex" | "other";
export type RegistrationStatus = "confirmed" | "cancelled" | "waitlisted";

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  short_description: string;
  event_type: EventType;
  category: string;
  start_date: string;
  end_date: string;
  timezone: string;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  meeting_url: string | null;
  meeting_platform: MeetingPlatform | null;
  meeting_id: string | null;
  meeting_passcode: string | null;
  capacity: number | null;
  registration_deadline: string | null;
  is_registration_open: boolean;
  image_url: string | null;
  gallery_images: string[];
  status: EventStatus;
  is_featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  event_tickets?: EventTicket[];
  event_registrations?: EventRegistration[];
  _registration_count?: number;
}

export interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  is_active: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  ticket_id: string | null;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: RegistrationStatus;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  // Joined
  event_tickets?: EventTicket;
  events?: Event;
}

export const EVENT_CATEGORIES = [
  "general",
  "workshop",
  "seminar",
  "conference",
  "webinar",
  "networking",
  "training",
  "mentorship",
  "career-fair",
] as const;

export const MEETING_PLATFORMS: { value: MeetingPlatform; label: string }[] = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
  { value: "webex", label: "Webex" },
  { value: "other", label: "Other" },
];
