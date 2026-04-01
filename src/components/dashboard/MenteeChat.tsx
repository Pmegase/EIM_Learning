"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ChatWindow from "@/components/dashboard/ChatWindow";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import { MessageCircle, Loader2 } from "lucide-react";

interface ActiveMentorship {
  id: string;
  mentor_id: string;
  status: string;
  mentor_name: string;
}

export default function MenteeChat() {
  const { user } = useAuth();
  const [mentorship, setMentorship] = useState<ActiveMentorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const fetchMentorship = useCallback(async () => {
    try {
      // Reuse mentorship-check-like logic but via mentorship-requests viewed from mentee side
      const data = await apiGet<{ mentorship: ActiveMentorship | null }>("/api/user/active-mentorship");
      setMentorship(data.mentorship);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const data = await apiGet<{ unread: number }>("/api/user/messages/unread");
      setUnread(data.unread);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchMentorship();
    fetchUnread();
  }, [fetchMentorship, fetchUnread]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  if (!mentorship) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-green-600" />
            My Mentor
            {unread > 0 && (
              <span className="h-5 min-w-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar avatarUrl={null} size="sm" fallbackColor="green" />
              <div>
                <p className="text-sm font-medium">{mentorship.mentor_name}</p>
                <Badge variant="success" className="text-[10px]">Active Mentorship</Badge>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setChatOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
              {unread > 0 && (
                <span className="ml-1 h-4 min-w-4 px-1 bg-white text-green-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {chatOpen && (
        <ChatWindow
          mentorshipId={mentorship.id}
          otherUserName={mentorship.mentor_name}
          onClose={() => setChatOpen(false)}
          onMessagesRead={() => setUnread(0)}
        />
      )}
    </>
  );
}
