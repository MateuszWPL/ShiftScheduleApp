"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingChoice } from "@/components/onboarding/OnboardingChoice";
import { CreateTeamWizard } from "@/components/onboarding/CreateTeamWizard";
import { JoinTeamFlow } from "@/components/onboarding/JoinTeamFlow";
import { authPaths } from "@/lib/app-paths";

type OnboardingStep = "choice" | "create-team" | "join-team";

function OnboardingContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  const [step, setStep] = useState<OnboardingStep>(codeFromUrl ? "join-team" : "choice");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push(authPaths.login);
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full mx-auto" />
          <p className="text-sm text-brand-dark-muted">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (step === "choice") {
    return (
      <OnboardingChoice
        userName={session?.user?.name || ""}
        onCreateTeam={() => setStep("create-team")}
        onJoinTeam={() => setStep("join-team")}
      />
    );
  }

  if (step === "create-team") {
    return <CreateTeamWizard onBack={() => setStep("choice")} />;
  }

  if (step === "join-team") {
    return (
      <JoinTeamFlow
        initialCode={codeFromUrl || ""}
        onBack={() => setStep("choice")}
      />
    );
  }

  return null;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-brand-warm border-t-brand rounded-full mx-auto" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
