"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const skipAuthChangeRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setProfileLoaded(true);
      return data;
    }

    // Profile doesn't exist — auto-create from auth metadata
    if (!data && !error) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const meta = authUser.user_metadata || {};
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            role: meta.role || "intern",
            full_name: meta.full_name || authUser.email || "User",
          })
          .select()
          .single();
        if (newProfile) {
          setProfile(newProfile);
          setProfileLoaded(true);
          return newProfile;
        }
      }
    }

    setProfile(null);
    setProfileLoaded(true);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setIsLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip if login/signup already handled the profile fetch
      if (skipAuthChangeRef.current) {
        skipAuthChangeRef.current = false;
        return;
      }
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setProfileLoaded(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side route protection
  useEffect(() => {
    if (isLoading || loggingOut) return;
    // Don't enforce routes until profile has been fetched
    if (user && !profileLoaded) return;

    const protectedRoutes = ["/admin", "/dashboard"];
    const isProtected = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtected && !user) {
      console.log("[AUTH GUARD] No user, redirecting to login");
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    if (pathname.startsWith("/admin") && profile && profile.role !== "admin") {
      console.log("[AUTH GUARD] Not admin, redirecting to dashboard. Role:", profile.role);
      router.replace("/dashboard");
    }
  }, [user, profile, profileLoaded, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Prevent onAuthStateChange from duplicating this work
    skipAuthChangeRef.current = true;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      const profileData = await fetchProfile(authUser.id);
      logActivity({ supabase, userId: authUser.id, userName: profileData?.full_name || email, action: "user.login", category: "user" });
      const redirectTo =
        profileData?.role === "admin" ? "/admin/dashboard" : "/dashboard";
      router.replace(redirectTo);
    }

    return {};
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Profile is auto-created by database trigger on auth.users insert
    if (data.user) {
      logActivity({ supabase, userId: data.user.id, userName: fullName, action: "user.signup", category: "user", details: { role } });
    }

    return {};
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign out regardless of errors (expired session, network, etc.)
    }
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
