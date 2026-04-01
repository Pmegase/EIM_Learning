"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPut } from "@/lib/api";
import type { Message } from "@/types/jobs";
import {
  X,
  Send,
  Loader2,
  MessageCircle,
} from "lucide-react";

interface Props {
  mentorshipId: string;
  otherUserName: string;
  onClose: () => void;
  onMessagesRead?: () => void;
}

export default function ChatWindow({ mentorshipId, otherUserName, onClose, onMessagesRead }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiGet<{ messages: Message[] }>(
        `/api/user/messages?mentorship_id=${mentorshipId}`
      );
      setMessages(data.messages);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [mentorshipId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark as read on open and when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      apiPut("/api/user/messages/read", { mentorship_id: mentorshipId })
        .then(() => onMessagesRead?.())
        .catch(() => {});
    }
  }, [messages.length, mentorshipId, onMessagesRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${mentorshipId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `mentorship_id=eq.${mentorshipId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mentorshipId]);

  // Polling fallback every 10s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    // Optimistic add
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      mentorship_id: mentorshipId,
      sender_id: user?.id || "",
      content,
      read: false,
      created_at: new Date().toISOString(),
      sender_name: "You",
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/user/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorship_id: mentorshipId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Replace temp with real message
      setMessages((prev) =>
        prev.map((m) => m.id === tempMsg.id ? { ...data.message, sender_name: "You" } : m)
      );
    } catch (err: unknown) {
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInput(content);
      toast({
        title: "Failed to send",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col" style={{ height: "min(600px, 80vh)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-green-600 rounded-t-xl">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium text-sm">{otherUserName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-green-700" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isOwn ? "order-1" : ""}`}>
                    {!isOwn && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                        {msg.sender_name || otherUserName}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-green-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-green-600 hover:bg-green-700"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
