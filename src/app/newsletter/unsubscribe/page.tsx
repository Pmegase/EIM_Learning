"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckCircle, Loader2, Mail } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>}>
      <UnsubscribeForm />
    </Suspense>
  );
}

function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const supabase = createClient();

  const handleUnsubscribe = async () => {
    if (!email) return;
    setStatus("loading");
    await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("email", email.toLowerCase());
    setStatus("done");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          {status === "done" ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-bold">Unsubscribed</h2>
              <p className="text-sm text-muted-foreground">
                You have been unsubscribed from the EIM Consult newsletter. You can re-subscribe at any time from our website.
              </p>
            </>
          ) : (
            <>
              <Mail className="h-12 w-12 text-gray-400 mx-auto" />
              <h2 className="text-xl font-bold">Unsubscribe</h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to unsubscribe <strong>{email}</strong> from the EIM Consult newsletter?
              </p>
              <Button
                onClick={handleUnsubscribe}
                variant="destructive"
                disabled={status === "loading" || !email}
              >
                {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Yes, Unsubscribe
              </Button>
            </>
          )}
          <Button asChild variant="outline">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
