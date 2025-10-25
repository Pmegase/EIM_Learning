import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminResetPassword: React.FC = () => {
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // SEO basics for this page
    document.title = "Admin Password Reset | EIM Consultancy";
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    metaDesc.setAttribute("content", "Reset admin password securely using your email.");
    if (!metaDesc.parentElement) document.head.appendChild(metaDesc);

    const canonical = document.querySelector('link[rel="canonical"]') || document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", window.location.href);
    if (!canonical.parentElement) document.head.appendChild(canonical);

    // Switch to reset mode if user came from recovery link
    if (window.location.hash.includes("type=recovery")) {
      setMode("reset");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    // Ensure we capture existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && window.location.hash.includes("type=recovery")) {
        setMode("reset");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reset link');
      }

      toast({
        title: "Reset link sent",
        description: "If the email exists, a reset link has been sent.",
      });
    } catch (err: any) {
      toast({
        title: "Unable to send reset link",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm the same password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You are now signed in." });
      navigate("/admin");
    } catch (err: any) {
      toast({
        title: "Failed to update password",
        description: err?.message || "Please try the link again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <article className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Admin Password Reset
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "request" ? (
              <form onSubmit={handleSendLink} className="space-y-4" aria-label="Request password reset">
                <div>
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Email address"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>Back to Login</Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4" aria-label="Set new password">
                <div>
                  <Input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-label="New password"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-label="Confirm new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/")}>Back to Website</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </article>
    </main>
  );
};

export default AdminResetPassword;
