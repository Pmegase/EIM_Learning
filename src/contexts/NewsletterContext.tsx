"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { NewsletterSubscriber, NewsletterCampaign } from "@/types/blog";

interface NewsletterContextType {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  subscriberCount: number;
  loading: boolean;
  addSubscriber: (email: string, name?: string) => Promise<{ success: boolean; message: string }>;
  removeSubscriber: (id: string) => Promise<void>;
  isSubscribed: (email: string) => boolean;
  confirmSubscriber: (token: string) => Promise<boolean>;
  addCampaign: (data: Pick<NewsletterCampaign, "subject" | "content" | "preview_text" | "segment">) => Promise<NewsletterCampaign | null>;
  updateCampaign: (id: string, data: Partial<NewsletterCampaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export const NewsletterProvider = ({ children }: { children: ReactNode }) => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Public: fetch confirmed subscriber count (no admin auth needed)
  const fetchSubscriberCount = useCallback(async () => {
    const { count } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    setSubscriberCount(count ?? 0);
  }, [supabase]);

  // Admin-only: fetch full subscriber + campaign data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, campRes] = await Promise.all([
        apiGet<{ subscribers: NewsletterSubscriber[] }>("/api/admin/newsletter/subscribers"),
        apiGet<{ campaigns: NewsletterCampaign[] }>("/api/admin/newsletter/campaigns"),
      ]);
      setSubscribers(subRes.subscribers || []);
      setCampaigns(campRes.campaigns || []);
      setSubscriberCount((subRes.subscribers || []).filter((s) => s.status === "confirmed").length);
    } catch {
      // Non-admin users will get 401 — just keep empty state
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch public subscriber count for all users
    fetchSubscriberCount();
    // Fetch admin data (will silently fail for non-admins)
    fetchData();
  }, [fetchData, fetchSubscriberCount]);

  const addSubscriber = async (email: string, name?: string) => {
    const normalized = email.toLowerCase().trim();
    const existing = subscribers.find((s) => s.email.toLowerCase() === normalized);

    if (existing) {
      if (existing.status === "confirmed") return { success: false, message: "Already subscribed" };
      if (existing.status === "pending") return { success: false, message: "Please check your email to confirm" };
      if (existing.status === "unsubscribed") {
        const token = crypto.randomUUID();
        await supabase.from("newsletter_subscribers").update({ status: "pending", confirm_token: token }).eq("id", existing.id);
        await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalized, name, token }) }).catch(() => {});
        await fetchSubscriberCount();
        return { success: true, message: "Please check your email to confirm" };
      }
    }

    const token = crypto.randomUUID();
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: normalized,
      name: name || null,
      status: "pending",
      confirm_token: token,
    });

    if (error) {
      if (error.code === "23505") return { success: false, message: "Already subscribed" };
      return { success: false, message: error.message };
    }

    await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalized, name, token }) }).catch(() => {});
    await fetchSubscriberCount();
    return { success: true, message: "Please check your email to confirm your subscription" };
  };

  const removeSubscriber = async (id: string) => {
    await apiDelete(`/api/admin/newsletter/subscribers?id=${id}`);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  const isSubscribed = (email: string) =>
    subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase() && s.status === "confirmed");

  const confirmSubscriber = async (token: string) => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "confirmed", confirm_token: null, subscribed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .select()
      .single();
    if (error || !data) return false;
    await fetchData();
    return true;
  };

  const addCampaign = async (data: Pick<NewsletterCampaign, "subject" | "content" | "preview_text" | "segment">) => {
    try {
      const campaign = await apiPost<NewsletterCampaign>("/api/admin/newsletter/campaigns", { ...data, status: "draft" });
      setCampaigns((prev) => [campaign, ...prev]);
      return campaign;
    } catch {
      return null;
    }
  };

  const updateCampaign = async (id: string, data: Partial<NewsletterCampaign>) => {
    await apiPut(`/api/admin/newsletter/campaigns/${id}`, data);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCampaign = async (id: string) => {
    await apiDelete(`/api/admin/newsletter/campaigns/${id}`);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <NewsletterContext.Provider
      value={{ subscribers, campaigns, subscriberCount, loading, addSubscriber, removeSubscriber, isSubscribed, confirmSubscriber, addCampaign, updateCampaign, deleteCampaign, refresh: fetchData }}
    >
      {children}
    </NewsletterContext.Provider>
  );
};

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (!context) throw new Error("useNewsletter must be used within a NewsletterProvider");
  return context;
};
