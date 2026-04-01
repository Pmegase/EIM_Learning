"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { Avatar } from "@/components/dashboard/AvatarUpload";
import {
  X,
  Loader2,
  MapPin,
  GraduationCap,
  Calendar,
  Link2,
  Globe,
  Code,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface PublicProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  university: string | null;
  field_of_study: string | null;
  graduation_year: string | null;
  skills: string[];
  interests: string[];
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  role: string;
}

interface Props {
  userId: string;
  onClose: () => void;
}

export default function StudentProfileDialog({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGet<{ profile: PublicProfile }>(`/api/user/profile/${userId}`);
      setProfile(data.profile);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-10 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : !profile ? (
          <div className="text-center py-16 text-muted-foreground">Profile not found</div>
        ) : (
          <>
            {/* Banner + Avatar */}
            <div className="h-20 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-t-xl" />
            <div className="px-6 pb-6">
              <div className="flex items-end -mt-8 mb-3">
                <Avatar avatarUrl={profile.avatar_url} size="md" fallbackColor="blue" />
              </div>

              {/* Name & headline */}
              <h3 className="text-lg font-bold text-gray-900">{profile.full_name}</h3>
              {profile.headline && <p className="text-sm text-gray-600">{profile.headline}</p>}
              {profile.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />{profile.location}
                </p>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-gray-700 mt-3 leading-relaxed">{profile.bio}</p>
              )}

              {/* Education */}
              {(profile.university || profile.field_of_study) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</h4>
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      {profile.university && <p className="text-sm font-medium">{profile.university}</p>}
                      {profile.field_of_study && <p className="text-sm text-gray-600">{profile.field_of_study}</p>}
                      {profile.graduation_year && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />Class of {profile.graduation_year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />Interests
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(profile.linkedin_url || profile.portfolio_url || profile.github_url) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
                      <Link2 className="h-4 w-4" />LinkedIn
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800">
                      <Globe className="h-4 w-4" />Portfolio
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800">
                      <Code className="h-4 w-4" />GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
