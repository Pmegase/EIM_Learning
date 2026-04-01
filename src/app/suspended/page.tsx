"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldOff, LogOut, Mail } from "lucide-react";

export default function SuspendedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-10 text-center space-y-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldOff className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Account Suspended</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="mailto:support@eimconsult.com"
              className="inline-flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-800"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
