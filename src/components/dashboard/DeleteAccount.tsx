"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiDelete } from "@/lib/api";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export default function DeleteAccount() {
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setStep("deleting");
    try {
      await apiDelete("/api/user/delete-account");
      toast({ title: "Account deleted" });
      window.location.href = "/";
    } catch (err: unknown) {
      toast({
        title: "Deletion failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
      setStep("confirm");
    }
  };

  if (step === "idle") {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setStep("confirm")}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-red-900">Are you sure?</h3>
            <p className="text-sm text-red-800">
              This will permanently delete your account, profile, uploaded documents, job applications, mentorships, messages, and all other data. This action cannot be undone.
            </p>
            <div className="space-y-1 pt-2">
              <p className="text-xs text-red-700 font-medium">Type DELETE to confirm:</p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="max-w-xs border-red-300 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || step === "deleting"}
              >
                {step === "deleting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" />Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-1" />Permanently Delete</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep("idle"); setConfirmText(""); }}
                disabled={step === "deleting"}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
