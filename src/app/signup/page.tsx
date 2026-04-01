"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { signupBaseSchema } from "@/lib/validations";
import type { UserRole } from "@/types";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Building,
  ShieldCheck,
} from "lucide-react";

const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "intern",
    label: "Intern / Student",
    description: "Looking for internship opportunities and mentorship",
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Experienced professional wanting to guide interns",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "corporate",
    label: "Corporate Partner",
    description: "Organization looking to recruit or partner",
    icon: <Building className="h-5 w-5" />,
  },
  {
    value: "admin",
    label: "Administrator",
    description: "EIM platform administrator (requires signup code)",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();
  const { signup } = useAuth();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!selectedRole) return;

    // Validate
    const result = signupBaseSchema.safeParse({
      email,
      password,
      confirmPassword,
      fullName,
      role: selectedRole,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Validate admin code
    if (selectedRole === "admin") {
      const expectedCode = process.env.NEXT_PUBLIC_ADMIN_SIGNUP_CODE;
      if (!adminCode || adminCode !== expectedCode) {
        setErrors({ adminCode: "Invalid admin signup code" });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await signup(email, password, fullName, selectedRole);
      if (error) {
        toast({
          title: "Signup failed",
          description: error,
          variant: "destructive",
        });
      } else {
        if (selectedRole === "mentor") {
          toast({
            title: "Account created!",
            description:
              "Please complete your mentor application to get started.",
          });
          router.push("/mentor-application");
        } else {
          toast({
            title: "Account created!",
            description:
              "Please check your email to verify your account, then sign in.",
          });
          router.push("/login");
        }
      }
    } catch {
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Image
            src="/uploads/hero-bg.png"
            alt="EIM Consultancy"
            width={96}
            height={96}
            className="h-24 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1
              ? "Select your role to get started"
              : "Fill in your details"}
          </p>
        </CardHeader>
        <CardContent>
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleSelect(role.value)}
                  className="w-full flex items-center gap-4 p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    {role.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{role.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <div className="text-green-600">
                  {roles.find((r) => r.value === selectedRole)?.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Signing up as:{" "}
                    {roles.find((r) => r.value === selectedRole)?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSelectedRole(null);
                    setErrors({});
                  }}
                  className="ml-auto text-sm text-green-600 hover:text-green-800"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Admin Signup Code */}
              {selectedRole === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="adminCode">Admin Signup Code</Label>
                  <Input
                    id="adminCode"
                    type="password"
                    placeholder="Enter the admin signup code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                  />
                  {errors.adminCode && (
                    <p className="text-sm text-red-500">{errors.adminCode}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Contact an existing administrator to obtain this code.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Sign in
              </Link>
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              &larr; Back to Website
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
