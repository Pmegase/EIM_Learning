"use client";

import React, { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";

interface Props {
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: "h-9 w-9", icon: "h-4 w-4", camera: "h-3 w-3", badge: "h-5 w-5 -bottom-0.5 -right-0.5" },
  md: { container: "h-16 w-16", icon: "h-6 w-6", camera: "h-3.5 w-3.5", badge: "h-6 w-6 -bottom-0.5 -right-0.5" },
  lg: { container: "h-20 w-20", icon: "h-8 w-8", camera: "h-4 w-4", badge: "h-7 w-7 -bottom-1 -right-1" },
};

export default function AvatarUpload({ avatarUrl, size = "lg", editable = false, className = "" }: Props) {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(avatarUrl);

  const s = sizeMap[size];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a JPEG, PNG, WebP, or GIF.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCurrentUrl(data.avatar_url);
      await refreshProfile();
      toast({ title: "Profile picture updated" });
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {currentUrl ? (
        <Image
          src={currentUrl}
          alt="Profile"
          width={80}
          height={80}
          className={`${s.container} rounded-full object-cover border-4 border-white shadow-md`}
        />
      ) : (
        <div className={`${s.container} bg-green-100 rounded-full flex items-center justify-center text-green-600 border-4 border-white shadow-md`}>
          <User className={s.icon} />
        </div>
      )}

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`absolute ${s.badge} bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors`}
          >
            {uploading ? <Loader2 className={`${s.camera} animate-spin`} /> : <Camera className={s.camera} />}
          </button>
        </>
      )}
    </div>
  );
}

/** Non-editable avatar display for use in lists */
export function Avatar({ avatarUrl, size = "sm", fallbackColor = "green" }: { avatarUrl: string | null; size?: "sm" | "md"; fallbackColor?: "green" | "blue" }) {
  const s = sizeMap[size];
  const colorMap = {
    green: { bg: "bg-green-100", text: "text-green-600" },
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
  };
  const c = colorMap[fallbackColor];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt="User"
        width={36}
        height={36}
        className={`${s.container} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${s.container} ${c.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
      <User className={`${s.icon} ${c.text}`} />
    </div>
  );
}
