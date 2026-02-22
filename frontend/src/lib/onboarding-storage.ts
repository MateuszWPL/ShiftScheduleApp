const KEY_WIZARD_SKIPPED = "shiftapp_onboarding_wizard_skipped";
const KEY_WIZARD_DONE = "shiftapp_onboarding_wizard_done";
const KEY_TOUR_SKIPPED = "shiftapp_app_tour_skipped";
const KEY_TOUR_DONE = "shiftapp_app_tour_done";

export function getOnboardingWizardSkipped(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_WIZARD_SKIPPED) === "1";
}

export function setOnboardingWizardSkipped(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_WIZARD_SKIPPED, "1");
}

export function getOnboardingWizardDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_WIZARD_DONE) === "1";
}

export function setOnboardingWizardDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_WIZARD_DONE, "1");
}

export function getAppTourSkipped(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_TOUR_SKIPPED) === "1";
}

export function setAppTourSkipped(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_TOUR_SKIPPED, "1");
}

export function getAppTourDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_TOUR_DONE) === "1";
}

export function setAppTourDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_TOUR_DONE, "1");
}
