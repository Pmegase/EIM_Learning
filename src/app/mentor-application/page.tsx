"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { apiPost } from "@/lib/api";
import {
  mentorPersonalInfoSchema,
  mentorExperienceSchema,
  mentorDetailsSchema,
} from "@/lib/validations";
import Image from "next/image";
import {
  Loader2,
  User,
  Briefcase,
  Heart,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Experience & Skillset", icon: Briefcase },
  { id: 3, title: "Mentorship Details", icon: Heart },
];

export default function MentorApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isLoading } = useAuth();
  const supabase = createClient();

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    title: "",
    fullName: "",
    organization: "",
    division: "",
    workEmail: "",
    workPhone: "",
  });

  const [experience, setExperience] = useState({
    positionsHeld: "",
    generalCompetencies: "",
    technicalCompetencies: "",
  });

  const [mentorDetails, setMentorDetails] = useState({
    whyMentor: "",
    maxMentees: 1,
    whatCanMenteeLearn: "",
  });

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setPersonalInfo((prev) => ({
        ...prev,
        fullName: profile.full_name || "",
      }));
    }
    if (user) {
      setPersonalInfo((prev) => ({
        ...prev,
        workEmail: user.email || "",
      }));
    }
  }, [profile, user]);

  // Check if already applied
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("mentor_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAlreadyApplied(true);
      }
    };
    checkExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Redirect if not logged in or not a mentor
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/mentor-application");
    }
  }, [user, isLoading, router]);

  const validateStep = () => {
    setErrors({});
    let result;

    switch (currentStep) {
      case 1:
        result = mentorPersonalInfoSchema.safeParse(personalInfo);
        break;
      case 2:
        result = mentorExperienceSchema.safeParse(experience);
        break;
      case 3:
        result = mentorDetailsSchema.safeParse(mentorDetails);
        break;
      default:
        return true;
    }

    if (!result?.success) {
      const fieldErrors: Record<string, string> = {};
      result?.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!user) return;

    setLoading(true);
    try {
      await apiPost("/api/user/mentor-apply", {
        title: personalInfo.title,
        full_name: personalInfo.fullName,
        organization: personalInfo.organization,
        division: personalInfo.division,
        work_email: personalInfo.workEmail,
        work_phone: personalInfo.workPhone,
        positions_held: experience.positionsHeld,
        general_competencies: experience.generalCompetencies,
        technical_competencies: experience.technicalCompetencies,
        why_mentor: mentorDetails.whyMentor,
        max_mentees: mentorDetails.maxMentees,
        what_can_mentee_learn: mentorDetails.whatCanMenteeLearn,
      });
      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description:
          "Your mentor application is under review. An admin will review it shortly.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto h-16 w-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Application Already Submitted</h2>
            <p className="text-sm text-muted-foreground">
              You have already submitted a mentor application. An administrator
              will review it and you&apos;ll be notified of the outcome.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              Thank you for applying to be a mentor at EIM. Your application is
              now under review. An administrator will review your application and
              you&apos;ll be notified once a decision has been made.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/uploads/hero-bg.png"
            alt="EIM Consultancy"
            width={64}
            height={64}
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Mentor Application
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete all sections below to apply as a mentor
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isActive
                          ? "bg-green-100 text-green-700 border-2 border-green-600"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-1 text-center max-w-[80px] sm:max-w-none ${isActive ? "text-green-700 font-medium" : "text-gray-500"}`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-5 ${
                      currentStep > step.id ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Mr, Mrs, Dr, Prof"
                    value={personalInfo.title}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={personalInfo.fullName}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    placeholder="Your organization"
                    value={personalInfo.organization}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        organization: e.target.value,
                      }))
                    }
                  />
                  {errors.organization && (
                    <p className="text-sm text-red-500">
                      {errors.organization}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Input
                    id="division"
                    placeholder="Your division/department"
                    value={personalInfo.division}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        division: e.target.value,
                      }))
                    }
                  />
                  {errors.division && (
                    <p className="text-sm text-red-500">{errors.division}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workEmail">Work Email Address</Label>
                  <Input
                    id="workEmail"
                    type="email"
                    placeholder="you@company.com"
                    value={personalInfo.workEmail}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        workEmail: e.target.value,
                      }))
                    }
                  />
                  {errors.workEmail && (
                    <p className="text-sm text-red-500">{errors.workEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workPhone">Work Phone Number</Label>
                  <Input
                    id="workPhone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={personalInfo.workPhone}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({
                        ...prev,
                        workPhone: e.target.value,
                      }))
                    }
                  />
                  {errors.workPhone && (
                    <p className="text-sm text-red-500">{errors.workPhone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Experience & Skillset */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                Experience & Skillset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="positionsHeld">
                  List of Positions & Grades You Have Held
                </Label>
                <Textarea
                  id="positionsHeld"
                  rows={4}
                  placeholder="e.g. Senior Manager - Grade 12, ABC Corp (2018-Present)&#10;Project Lead - Grade 10, XYZ Inc (2014-2018)"
                  value={experience.positionsHeld}
                  onChange={(e) =>
                    setExperience((prev) => ({
                      ...prev,
                      positionsHeld: e.target.value,
                    }))
                  }
                />
                {errors.positionsHeld && (
                  <p className="text-sm text-red-500">{errors.positionsHeld}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="generalCompetencies">
                  Describe What You Consider To Be Your Strongest General
                  Competencies
                </Label>
                <Textarea
                  id="generalCompetencies"
                  rows={4}
                  placeholder="e.g. Leadership, strategic planning, communication, problem-solving..."
                  value={experience.generalCompetencies}
                  onChange={(e) =>
                    setExperience((prev) => ({
                      ...prev,
                      generalCompetencies: e.target.value,
                    }))
                  }
                />
                {errors.generalCompetencies && (
                  <p className="text-sm text-red-500">
                    {errors.generalCompetencies}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalCompetencies">
                  Describe What You Consider To Be Your Strongest Technical
                  Competencies
                </Label>
                <Textarea
                  id="technicalCompetencies"
                  rows={4}
                  placeholder="e.g. Financial analysis, data modelling, project management methodologies..."
                  value={experience.technicalCompetencies}
                  onChange={(e) =>
                    setExperience((prev) => ({
                      ...prev,
                      technicalCompetencies: e.target.value,
                    }))
                  }
                />
                {errors.technicalCompetencies && (
                  <p className="text-sm text-red-500">
                    {errors.technicalCompetencies}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Mentorship Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                Mentorship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whyMentor">
                  Why Do You Want To Be a Mentor?
                </Label>
                <Textarea
                  id="whyMentor"
                  rows={4}
                  placeholder="Share your motivation for becoming a mentor..."
                  value={mentorDetails.whyMentor}
                  onChange={(e) =>
                    setMentorDetails((prev) => ({
                      ...prev,
                      whyMentor: e.target.value,
                    }))
                  }
                />
                {errors.whyMentor && (
                  <p className="text-sm text-red-500">{errors.whyMentor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMentees">
                  How Many Mentees Would You Like To Mentor?
                </Label>
                <Input
                  id="maxMentees"
                  type="number"
                  min={1}
                  max={10}
                  value={mentorDetails.maxMentees}
                  onChange={(e) =>
                    setMentorDetails((prev) => ({
                      ...prev,
                      maxMentees: parseInt(e.target.value) || 1,
                    }))
                  }
                />
                {errors.maxMentees && (
                  <p className="text-sm text-red-500">{errors.maxMentees}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatCanMenteeLearn">
                  What Do You Think A Mentee Can Learn From You?
                </Label>
                <Textarea
                  id="whatCanMenteeLearn"
                  rows={4}
                  placeholder="Describe the skills, knowledge, and experiences you can share..."
                  value={mentorDetails.whatCanMenteeLearn}
                  onChange={(e) =>
                    setMentorDetails((prev) => ({
                      ...prev,
                      whatCanMenteeLearn: e.target.value,
                    }))
                  }
                />
                {errors.whatCanMenteeLearn && (
                  <p className="text-sm text-red-500">
                    {errors.whatCanMenteeLearn}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-700"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
