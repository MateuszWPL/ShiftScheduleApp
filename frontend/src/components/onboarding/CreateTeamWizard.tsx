"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { paths } from "@/lib/app-paths";
import {
  createTeam,
  inviteByEmail,
  updateBusinessHours,
  batchCreatePositions,
  completeOnboarding,
  type BusinessHoursDay,
} from "@/lib/api";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Building2,
  Mail,
  Link2,
  Copy,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface Props {
  onBack: () => void;
}

type WizardStep = "name" | "invite" | "hours" | "positions" | "success";

const STEP_ORDER: WizardStep[] = ["name", "invite", "hours", "positions", "success"];

const DAY_NAMES = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

const DEFAULT_HOURS: BusinessHoursDay[] = DAY_NAMES.map((_, i) => ({
  dayOfWeek: i,
  isOpen: i < 5,
  openTime: "08:00",
  closeTime: i === 4 ? "23:00" : "22:00",
}));

const POSITION_SUGGESTIONS = [
  { name: "Kelner", color: "#10B77F" },
  { name: "Barista", color: "#3498DB" },
  { name: "Kucharz", color: "#E74C3C" },
  { name: "Barman", color: "#9B59B6" },
  { name: "Hostessa", color: "#F39C12" },
  { name: "Kasjer", color: "#1ABC9C" },
  { name: "Zmywak", color: "#6B8E23" },
  { name: "Manager zmiany", color: "#0F172A" },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-brand-warm/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-brand whitespace-nowrap">{pct}%</span>
    </div>
  );
}

export function CreateTeamWizard({ onBack }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("name");
  const stepIdx = STEP_ORDER.indexOf(step);

  // Step 1 state
  const [teamName, setTeamName] = useState("");
  const [teamData, setTeamData] = useState<any>(null);

  // Step 2 state
  const [emailsText, setEmailsText] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Step 3 state
  const [businessHours, setBusinessHours] = useState<BusinessHoursDay[]>(DEFAULT_HOURS);

  // Step 4 state
  const [positions, setPositions] = useState<{ name: string; color: string }[]>([]);
  const [newPosName, setNewPosName] = useState("");
  const [newPosColor, setNewPosColor] = useState("#10B77F");

  // Mutations
  const createTeamMut = useMutation({
    mutationFn: () => createTeam(teamName),
    onSuccess: (data) => {
      setTeamData(data);
      toast.success("Firma założona!");
      setStep("invite");
    },
    onError: (err: Error) => {
      toast.error("Błąd tworzenia firmy", { description: err.message });
    },
  });

  const inviteMut = useMutation({
    mutationFn: (emails: string[]) => inviteByEmail(emails),
    onSuccess: (data) => {
      toast.success(`Wysłano ${data.sent?.length || 0} zaproszeń`);
    },
    onError: (err: Error) => {
      toast.error("Błąd wysyłania", { description: err.message });
    },
  });

  const hoursMut = useMutation({
    mutationFn: () => updateBusinessHours(businessHours),
    onSuccess: () => {
      toast.success("Godziny zapisane!");
      setStep("positions");
    },
    onError: (err: Error) => {
      toast.error("Błąd zapisywania godzin", { description: err.message });
    },
  });

  const positionsMut = useMutation({
    mutationFn: () => batchCreatePositions(positions),
    onSuccess: () => {
      completeMut.mutate();
    },
    onError: (err: Error) => {
      toast.error("Błąd tworzenia stanowisk", { description: err.message });
    },
  });

  const completeMut = useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: () => {
      setStep("success");
    },
    onError: () => {
      setStep("success");
    },
  });

  const inviteCode = teamData?.team?.inviteCode || teamData?.inviteCode || "";
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/onboarding?code=${inviteCode}`
      : "";

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleSendInvites = () => {
    const emails = emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
      .slice(0, 5);
    if (emails.length > 0) {
      inviteMut.mutate(emails);
    }
  };

  const updateDay = (dayIdx: number, field: keyof BusinessHoursDay, value: any) => {
    setBusinessHours((prev) =>
      prev.map((d) => (d.dayOfWeek === dayIdx ? { ...d, [field]: value } : d))
    );
  };

  const addPosition = () => {
    const name = newPosName.trim();
    if (!name) return;
    if (positions.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Stanowisko już istnieje");
      return;
    }
    setPositions((prev) => [...prev, { name, color: newPosColor }]);
    setNewPosName("");
  };

  const addSuggestion = (s: { name: string; color: string }) => {
    if (positions.some((p) => p.name.toLowerCase() === s.name.toLowerCase())) return;
    setPositions((prev) => [...prev, s]);
  };

  const removePosition = (idx: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFinish = () => {
    if (positions.length > 0) {
      positionsMut.mutate();
    } else {
      completeMut.mutate();
    }
  };

  const goToGrafik = () => {
    window.location.href = paths.grafik;
  };

  if (step === "success") {
    return (
      <div className="w-full max-w-lg mx-auto text-center space-y-6">
        <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-brand-muted flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-brand" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Wszystko gotowe!</h1>
            <p className="text-sm text-brand-dark-muted mt-2">
              Twoja firma <span className="text-brand font-semibold">Staffer</span> została
              skonfigurowana pomyślnie. Czas ułożyć pierwszy grafik i zaprosić zespół.
            </p>
          </div>

          <Button onClick={goToGrafik} className="w-full gap-2 h-11">
            Przejdź do grafiku
            <ArrowRight className="h-4 w-4" />
          </Button>

          <button
            onClick={() => router.push(paths.home)}
            className="text-sm text-brand-dark-muted hover:text-brand transition-colors"
          >
            Pokaż samouczek
          </button>

          <div className="border-t border-brand-warm/30 pt-4 flex items-center justify-between text-xs text-brand-dark-muted">
            <span className="font-semibold text-brand">KROK 4 Z 4</span>
            <span className="font-semibold text-brand">100% ukończone</span>
          </div>
          <div className="h-2 bg-brand-warm/40 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Logo variant="icon" className="h-7 w-7" />
          <span className="font-semibold text-brand-dark text-sm">Onboarding</span>
        </div>
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-brand-warm-light text-brand-dark-muted hover:text-brand-dark transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-brand-warm/30 overflow-hidden">
        {/* Step indicator + progress */}
        <div className="px-6 pt-5 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand uppercase tracking-wider">
              KROK {Math.min(stepIdx + 1, 4)} Z 4
            </span>
            <span className="text-xs font-semibold text-brand">
              {Math.round(((stepIdx + 1) / 4) * 100)}% ukończono
            </span>
          </div>
          <ProgressBar current={stepIdx + 1} total={4} />
        </div>

        <div className="px-6 pb-6">
          {/* STEP 1: Team name */}
          {step === "name" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brand-dark">Stwórz swój zespół</h2>
                <p className="text-sm text-brand-dark-muted mt-1">
                  Zacznij od podania nazwy swojej firmy lub lokalu. Pomoże nam to dostosować interfejs do Twoich potrzeb.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1.5">
                  Nazwa Twojej firmy/lokalu
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-dark-muted/50" />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    placeholder="np. Emerald Glass Cafe"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-brand-dark-muted mt-1.5">
                  Możesz zmienić tę nazwę później w ustawieniach konta
                </p>
              </div>

              <Button
                onClick={() => createTeamMut.mutate()}
                disabled={!teamName.trim() || createTeamMut.isPending}
                className="w-full gap-2 h-11"
              >
                {createTeamMut.isPending ? "Tworzenie..." : "Dalej"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Invite team */}
          {step === "invite" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-brand-dark">Zbuduj swój zespół</h2>
                <p className="text-sm text-brand-dark-muted mt-1">
                  Zaproś pierwszych pracowników, aby móc przypisać im zmiany.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Email invite */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                    <Mail className="h-4 w-4 text-brand" />
                    Zaproś przez e-mail
                  </div>
                  <div>
                    <label className="text-xs text-brand-dark-muted">Lista adresów e-mail</label>
                    <textarea
                      value={emailsText}
                      onChange={(e) => setEmailsText(e.target.value)}
                      className="w-full mt-1 p-3 border border-brand-warm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-sm resize-none h-24"
                      placeholder={"jan.kowalski@firma.pl, anna.nowak@firma.pl..."}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSendInvites}
                    disabled={!emailsText.trim() || inviteMut.isPending}
                    className="w-full gap-1.5"
                  >
                    {inviteMut.isPending ? "Wysyłanie..." : "Wyślij zaproszenia"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Link + code */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                      <Link2 className="h-4 w-4 text-brand" />
                      Link do zaproszenia
                    </div>
                    <p className="text-xs text-brand-dark-muted">
                      Udostępnij ten link swojemu zespołowi, aby mogli dołączyć samodzielnie.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="flex-1 text-xs p-2 border border-brand-warm rounded-lg bg-brand-warm-light/30 text-brand-dark-muted truncate"
                      />
                      <Button size="sm" variant="outline" onClick={copyLink} className="flex-shrink-0 gap-1">
                        {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {linkCopied ? "Skopiowano" : "Kopiuj link"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                      <span className="text-brand font-bold">#</span>
                      Kod zaproszenia
                    </div>
                    <p className="text-xs text-brand-dark-muted">
                      Pracownicy mogą wpisać ten kod bezpośrednio w aplikacji mobilnej.
                    </p>
                    <div
                      onClick={copyCode}
                      className="flex items-center justify-center gap-1.5 p-3 border-2 border-dashed border-brand-warm rounded-xl bg-brand-warm-light/20 cursor-pointer hover:border-brand/40 transition-colors"
                    >
                      <code className="text-2xl font-mono font-bold tracking-[0.2em] text-brand-dark select-all">
                        {inviteCode}
                      </code>
                      {codeCopied && (
                        <Check className="h-4 w-4 text-brand flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-warm/30">
                <Button variant="ghost" size="sm" onClick={() => setStep("name")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Wróć
                </Button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep("hours")}
                    className="text-sm text-brand-dark-muted hover:text-brand-dark transition-colors"
                  >
                    Pomiń na razie
                  </button>
                  <Button size="sm" onClick={() => setStep("hours")} className="gap-1">
                    Kontynuuj
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Business hours */}
          {step === "hours" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-brand-dark-muted mb-1">Konfiguracja godzin</p>
                <h2 className="text-xl font-bold text-brand-dark">Godziny otwarcia</h2>
                <p className="text-sm text-brand-dark-muted mt-1">
                  Kiedy Twój biznes jest otwarty dla klientów?
                </p>
              </div>

              <div className="space-y-2">
                {businessHours.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      day.isOpen
                        ? "border-brand-warm bg-white"
                        : "border-brand-warm/30 bg-brand-warm-light/20"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 w-32">
                      <input
                        type="checkbox"
                        checked={day.isOpen}
                        onChange={(e) => updateDay(day.dayOfWeek, "isOpen", e.target.checked)}
                        className="h-4 w-4 rounded border-brand-warm text-brand focus:ring-brand accent-brand cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-medium text-brand-dark block leading-tight">
                          {DAY_NAMES[day.dayOfWeek]}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            day.isOpen ? "text-brand" : "text-brand-dark-muted/60"
                          }`}
                        >
                          {day.isOpen ? "Otwarte" : "Zamknięte"}
                        </span>
                      </div>
                    </label>
                    {day.isOpen ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={day.openTime}
                          onChange={(e) => updateDay(day.dayOfWeek, "openTime", e.target.value)}
                          className="px-2.5 py-1.5 border border-brand-warm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand w-[110px]"
                        />
                        <span className="text-brand-dark-muted text-sm">–</span>
                        <input
                          type="time"
                          value={day.closeTime}
                          onChange={(e) => updateDay(day.dayOfWeek, "closeTime", e.target.value)}
                          className="px-2.5 py-1.5 border border-brand-warm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand w-[110px]"
                        />
                      </div>
                    ) : (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-[110px] h-[34px] bg-brand-warm/20 rounded-lg" />
                        <span className="text-brand-dark-muted text-sm">–</span>
                        <div className="w-[110px] h-[34px] bg-brand-warm/20 rounded-lg" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-brand-warm/30">
                <Button variant="ghost" size="sm" onClick={() => setStep("invite")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Wróć
                </Button>
                <Button
                  size="sm"
                  onClick={() => hoursMut.mutate()}
                  disabled={hoursMut.isPending}
                  className="gap-1"
                >
                  {hoursMut.isPending ? "Zapisywanie..." : "Kontynuuj"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Positions */}
          {step === "positions" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-brand-dark-muted mb-1">Konfiguracja stanowisk</p>
                <h2 className="text-xl font-bold text-brand-dark">Dodaj stanowiska</h2>
                <p className="text-sm text-brand-dark-muted mt-1">
                  Zdefiniuj stanowiska w Twojej firmie. Pomogą uporządkować grafik zmian.
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-medium text-brand-dark-muted mb-2">Szybkie dodawanie:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POSITION_SUGGESTIONS.filter(
                    (s) => !positions.some((p) => p.name.toLowerCase() === s.name.toLowerCase())
                  ).map((s) => (
                    <button
                      key={s.name}
                      onClick={() => addSuggestion(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-warm/50 text-xs font-medium text-brand-dark hover:border-brand hover:bg-brand-warm-light/50 transition-all"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                      <Plus className="h-3 w-3 text-brand-dark-muted" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Added positions */}
              {positions.length > 0 && (
                <div className="space-y-1.5">
                  {positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-brand-warm/40 bg-white"
                    >
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pos.color }} />
                      <span className="text-sm font-medium text-brand-dark flex-1">{pos.name}</span>
                      <button
                        onClick={() => removePosition(idx)}
                        className="p-1 text-brand-dark-muted/50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom add */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newPosColor}
                  onChange={(e) => setNewPosColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-brand-warm cursor-pointer"
                />
                <input
                  type="text"
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPosition()}
                  className="flex-1 px-3 py-2 border border-brand-warm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="Nazwa stanowiska..."
                />
                <Button size="sm" variant="outline" onClick={addPosition} disabled={!newPosName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-brand-warm/30">
                <Button variant="ghost" size="sm" onClick={() => setStep("hours")} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Wróć
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinish}
                  disabled={positionsMut.isPending || completeMut.isPending}
                  className="gap-1"
                >
                  {positionsMut.isPending || completeMut.isPending ? "Zapisywanie..." : "Zakończ konfigurację"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer help */}
      <div className="text-center mt-4">
        <p className="text-xs text-brand-dark-muted">
          <HelpCircle className="h-3 w-3 inline mr-1" />
          Potrzebujesz pomocy?{" "}
          <a href="mailto:support@staffer.pl" className="text-brand font-medium hover:text-brand-light">
            Skontaktuj się z nami
          </a>
        </p>
      </div>
    </div>
  );
}
