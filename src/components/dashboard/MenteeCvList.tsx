"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import StudentProfileDialog from "@/components/dashboard/StudentProfileDialog";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import { Users, Loader2, Eye } from "lucide-react";

interface Mentee {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  university: string | null;
}

export default function MenteeCvList() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const fetchMentees = useCallback(async () => {
    try {
      const data = await apiGet<{ mentees: Mentee[] }>("/api/user/mentees");
      setMentees(data.mentees);
    } catch {
      // Not a mentor or no mentees
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMentees();
  }, [fetchMentees]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  if (mentees.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            Active Mentees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mentees.map((mentee) => (
              <div
                key={mentee.user_id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar avatarUrl={mentee.avatar_url} size="sm" fallbackColor="blue" />
                  <div>
                    <p className="text-sm font-medium">{mentee.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mentee.headline || mentee.university || "Student"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingUserId(mentee.user_id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Profile
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {viewingUserId && (
        <StudentProfileDialog
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </>
  );
}
