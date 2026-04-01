"use client"

import React, { useState } from "react";
import { Mail, Send, Sparkles, Shield, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNewsletter } from "@/contexts/NewsletterContext";

const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addSubscriber, subscribers } = useNewsletter();

  const confirmedCount = subscribers.filter((s) => s.status === "confirmed").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addSubscriber(email.trim());

      if (result.success) {
        toast({
          title: "Check your email!",
          description: result.message,
        });
        setEmail("");
      } else {
        toast({
          title: "Heads up",
          description: result.message,
        });
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 items-center">
            {/* Left side — copy */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                <Sparkles className="h-4 w-4" />
                <span>Free newsletter</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Stay Ahead in Your <br className="hidden md:block" />Career Journey
              </h2>

              <p className="text-green-100 text-lg leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                Get curated mentorship tips, training opportunities, job openings, and career development insights delivered to your inbox.
              </p>

              {/* Trust signals */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-5 text-sm text-green-100/90">
                <span className="flex items-center gap-1.5">
                  <BellRing className="h-4 w-4 text-green-200" />
                  Weekly updates
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-200" />
                  No spam, ever
                </span>
                {confirmedCount > 5 && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-green-200" />
                    {confirmedCount}+ subscribers
                  </span>
                )}
              </div>
            </div>

            {/* Right side — form card */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-center mb-5">
                  <div className="relative">
                    <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <Mail className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Sparkles className="h-2.5 w-2.5 text-yellow-800" />
                    </div>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-center mb-1">Subscribe Now</h3>
                <p className="text-green-100/80 text-xs text-center mb-5">
                  Join our community and never miss an update.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/95 border-0 h-12 text-base text-gray-800 placeholder:text-gray-400 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-white/50"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 rounded-xl text-base font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Subscribe
                        <Send className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <p className="text-green-200/60 text-[11px] text-center mt-4 leading-relaxed">
                  You&apos;ll receive a confirmation email.
                  <br />Unsubscribe at any time — no strings attached.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
