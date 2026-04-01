"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNewsletter } from "@/contexts/NewsletterContext";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ConfirmNewsletterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>}>
      <ConfirmForm />
    </Suspense>
  );
}

function ConfirmForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { confirmSubscriber } = useNewsletter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const confirm = async () => {
      if (!token) { setStatus("error"); return; }
      const ok = await confirmSubscriber(token);
      setStatus(ok ? "success" : "error");
    };
    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
              <h2 className="text-xl font-bold">Confirming...</h2>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-bold text-green-700">Subscription Confirmed!</h2>
              <p className="text-sm text-muted-foreground">
                Thank you for confirming your email. You&apos;ll now receive our newsletter with updates on mentorship programs, training, and career tips.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-red-700">Confirmation Failed</h2>
              <p className="text-sm text-muted-foreground">
                This confirmation link is invalid or has already been used. Please try subscribing again.
              </p>
            </>
          )}
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
