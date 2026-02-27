"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeamSettings,
  updateTeamSettings,
  updateTeamName,
  regenerateInviteCode,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  type TeamSettingsResponse,
  type Position,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Key,
  Bell,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Save,
  Info,
  Shield,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

type TabId = "company" | "positions" | "invite" | "notifications" | "schedule";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "company", label: "Firma", icon: <Building2 className="h-4 w-4" /> },
  { id: "positions", label: "Stanowiska", icon: <Briefcase className="h-4 w-4" /> },
  { id: "invite", label: "Zaproszenia", icon: <Key className="h-4 w-4" /> },
  { id: "schedule", label: "Grafik", icon: <Clock className="h-4 w-4" /> },
  { id: "notifications", label: "Powiadomienia", icon: <Bell className="h-4 w-4" /> },
];

const POSITION_COLORS = [
  "#8FACDB", "#FF8400", "#6B8E23", "#E74C3C", "#9B59B6",
  "#1ABC9C", "#F39C12", "#3498DB", "#E67E22", "#2ECC71",
  "#E91E63", "#00BCD4", "#795548", "#607D8B",
];

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
          checked ? "bg-brand" : "bg-brand-dark/15"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-brand-dark group-hover:text-brand transition-colors">{label}</p>
        {description && <p className="text-[11px] text-brand-dark-soft mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { dbUser } = useDashboardUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [codeCopied, setCodeCopied] = useState(false);

  // Form state
  const [teamName, setTeamName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [openHour, setOpenHour] = useState(6);
  const [closeHour, setCloseHour] = useState(22);
  const [minShiftMin, setMinShiftMin] = useState(240);
  const [maxShiftMin, setMaxShiftMin] = useState(720);
  const [notifyAssigned, setNotifyAssigned] = useState(true);
  const [notifyPublished, setNotifyPublished] = useState(true);
  const [notifyMarket, setNotifyMarket] = useState(true);
  const [notifyAnnounce, setNotifyAnnounce] = useState(true);

  // Position management state
  const [newPosName, setNewPosName] = useState("");
  const [newPosColor, setNewPosColor] = useState(POSITION_COLORS[0]);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosName, setEditPosName] = useState("");
  const [editPosColor, setEditPosColor] = useState("");

  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";
  const isOwner = dbUser?.role === "OWNER";

  useEffect(() => {
    if (dbUser && !isAdmin) {
      router.replace("/");
    }
  }, [dbUser, isAdmin, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["team-settings"],
    queryFn: getTeamSettings,
    enabled: isAdmin,
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    enabled: isAdmin,
  });

  // Populate form when data loads
  useEffect(() => {
    if (data) {
      setTeamName(data.team.name);
      setCompanyName(data.settings.companyName || "");
      setOpenHour(data.settings.defaultOpenHour);
      setCloseHour(data.settings.defaultCloseHour);
      setMinShiftMin(data.settings.minShiftDurationMin);
      setMaxShiftMin(data.settings.maxShiftDurationMin);
      setNotifyAssigned(data.settings.notifyShiftAssigned);
      setNotifyPublished(data.settings.notifyShiftPublished);
      setNotifyMarket(data.settings.notifyMarketplace);
      setNotifyAnnounce(data.settings.notifyAnnouncements);
    }
  }, [data]);

  const updateSettingsMut = useMutation({
    mutationFn: updateTeamSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      toast.success("Ustawienia zapisane");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateNameMut = useMutation({
    mutationFn: updateTeamName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      toast.success("Nazwa zespołu zaktualizowana");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerateCodeMut = useMutation({
    mutationFn: regenerateInviteCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-settings"] });
      toast.success("Kod zaproszenia został zregenerowany");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPosMut = useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setNewPosName("");
      setNewPosColor(POSITION_COLORS[0]);
      toast.success("Stanowisko dodane");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePosMut = useMutation({
    mutationFn: (args: { id: string; data: { name?: string; color?: string } }) =>
      updatePosition(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setEditingPosId(null);
      toast.success("Stanowisko zaktualizowane");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePosMut = useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Stanowisko usunięte");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreatePosition = () => {
    const name = newPosName.trim();
    if (!name) return;
    createPosMut.mutate({ name, color: newPosColor });
  };

  const handleStartEditPosition = (pos: Position) => {
    setEditingPosId(pos.id);
    setEditPosName(pos.name);
    setEditPosColor(pos.color);
  };

  const handleSaveEditPosition = () => {
    if (!editingPosId || !editPosName.trim()) return;
    updatePosMut.mutate({ id: editingPosId, data: { name: editPosName.trim(), color: editPosColor } });
  };

  const handleCopyCode = () => {
    if (data?.team.inviteCode) {
      navigator.clipboard.writeText(data.team.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleSaveCompany = () => {
    updateNameMut.mutate(teamName);
    updateSettingsMut.mutate({ companyName: companyName || null });
  };

  const handleSaveSchedule = () => {
    if (openHour >= closeHour) {
      toast.error("Godzina otwarcia musi być wcześniejsza niż zamknięcia");
      return;
    }
    if (minShiftMin > maxShiftMin) {
      toast.error("Minimalna długość zmiany nie może być większa niż maksymalna");
      return;
    }
    updateSettingsMut.mutate({
      defaultOpenHour: openHour,
      defaultCloseHour: closeHour,
      minShiftDurationMin: minShiftMin,
      maxShiftDurationMin: maxShiftMin,
    });
  };

  const handleSaveNotifications = () => {
    updateSettingsMut.mutate({
      notifyShiftAssigned: notifyAssigned,
      notifyShiftPublished: notifyPublished,
      notifyMarketplace: notifyMarket,
      notifyAnnouncements: notifyAnnounce,
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-brand-dark-muted">
        Przekierowuję...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="inline-flex items-center gap-2 text-brand-dark-muted text-sm">
          <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          Ładowanie ustawień...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
          <Settings className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Ustawienia</h1>
          <p className="text-xs text-brand-dark-muted">Zarządzaj ustawieniami zespołu i firmy</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-brand-warm rounded-xl p-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 min-w-0 justify-center shrink-0 touch-manipulation ${
              activeTab === tab.id
                ? "bg-brand/10 text-brand"
                : "text-brand-dark-muted hover:text-brand-dark hover:bg-brand-warm-light"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-brand-warm rounded-xl shadow-sm overflow-hidden">
        {/* COMPANY TAB */}
        {activeTab === "company" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-4">Dane firmy</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Nazwa zespołu</label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nazwa zespołu"
                    maxLength={100}
                    className="border-brand-warm focus:border-brand focus:ring-brand/20"
                  />
                  <p className="text-[10px] text-brand-dark-soft mt-1">Widoczna dla wszystkich członków zespołu</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Nazwa firmy (opcjonalna)</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Np. Restauracja Pod Lipą"
                    maxLength={100}
                    className="border-brand-warm focus:border-brand focus:ring-brand/20"
                  />
                  <p className="text-[10px] text-brand-dark-soft mt-1">Wyświetlana w nagłówkach i raportach</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-brand-warm">
              <p className="text-[10px] text-brand-dark-soft">
                Zespół utworzony: {data?.team.createdAt ? new Date(data.team.createdAt).toLocaleDateString("pl-PL") : "—"}
              </p>
              <Button
                onClick={handleSaveCompany}
                disabled={updateNameMut.isPending || updateSettingsMut.isPending}
                className="gap-1.5 bg-brand hover:bg-brand-light text-white text-sm"
              >
                <Save className="h-3.5 w-3.5" />
                Zapisz
              </Button>
            </div>
          </div>
        )}

        {/* POSITIONS TAB */}
        {activeTab === "positions" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-1">Stanowiska</h2>
              <p className="text-xs text-brand-dark-muted mb-5">
                Zdefiniuj stanowiska w zespole. Pracownicy mogą mieć przypisane jedno lub więcej stanowisk — 
                ułatwia to tworzenie grafiku i automatyczne filtrowanie.
              </p>

              {/* Create new position */}
              <div className="flex items-end gap-2 mb-5">
                <div className="flex-1">
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Nowe stanowisko</label>
                  <Input
                    value={newPosName}
                    onChange={(e) => setNewPosName(e.target.value)}
                    placeholder="np. Kelner, Barista, Kucharz"
                    maxLength={50}
                    className="border-brand-warm focus:border-brand focus:ring-brand/20"
                    onKeyDown={(e) => e.key === "Enter" && handleCreatePosition()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Kolor</label>
                  <div className="flex gap-1">
                    {POSITION_COLORS.slice(0, 7).map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewPosColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          newPosColor === c ? "border-brand-dark scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleCreatePosition}
                  disabled={!newPosName.trim() || createPosMut.isPending}
                  className="gap-1 bg-brand hover:bg-brand-light text-white text-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj
                </Button>
              </div>

              {/* Positions list */}
              {positionsLoading ? (
                <div className="text-sm text-brand-dark-soft text-center py-8">Ładowanie...</div>
              ) : positions.length === 0 ? (
                <div className="text-center py-10 text-brand-dark-soft">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Brak zdefiniowanych stanowisk</p>
                  <p className="text-xs mt-1">Dodaj pierwsze stanowisko powyżej</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-brand-warm bg-white hover:bg-brand-warm-light/50 transition-colors group"
                    >
                      {editingPosId === pos.id ? (
                        <>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer"
                            style={{ backgroundColor: editPosColor }}
                            onClick={() => {
                              const idx = POSITION_COLORS.indexOf(editPosColor);
                              setEditPosColor(POSITION_COLORS[(idx + 1) % POSITION_COLORS.length]);
                            }}
                            title="Kliknij, aby zmienić kolor"
                          />
                          <Input
                            value={editPosName}
                            onChange={(e) => setEditPosName(e.target.value)}
                            className="flex-1 h-8 text-sm border-brand-warm"
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEditPosition()}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEditPosition}
                            disabled={updatePosMut.isPending}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPosId(null)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: pos.color }}
                          />
                          <span className="flex-1 text-sm font-medium text-brand-dark">
                            {pos.name}
                          </span>
                          <span className="text-[10px] text-brand-dark-soft mr-2">
                            {pos._count?.employees ?? 0} prac. · {pos._count?.shifts ?? 0} zmian
                          </span>
                          <button
                            onClick={() => handleStartEditPosition(pos)}
                            className="p-1.5 rounded hover:bg-blue-50 text-brand-dark-soft hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Usunąć stanowisko "${pos.name}"?`)) {
                                deletePosMut.mutate(pos.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-50 text-brand-dark-soft hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INVITE TAB */}
        {activeTab === "invite" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-4">Kod zaproszenia</h2>
              <p className="text-xs text-brand-dark-muted mb-4">
                Udostępnij ten kod pracownikom, aby mogli dołączyć do Twojego zespołu.
              </p>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-warm-light/30 border border-brand-warm">
                <code className="flex-1 text-2xl font-mono tracking-[0.2em] text-brand-dark font-bold select-all text-center">
                  {data?.team.inviteCode || "—"}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-lg hover:bg-brand-muted text-brand-dark-muted hover:text-brand transition-colors"
                  title="Kopiuj kod"
                >
                  {codeCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isOwner && (
              <div className="pt-4 border-t border-brand-warm">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/40 mb-4">
                  <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700/70">
                    Regeneracja kodu sprawi, że stary kod przestanie działać. Osoby, które jeszcze nie dołączyły, będą potrzebować nowego kodu.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Czy na pewno chcesz wygenerować nowy kod? Stary kod przestanie działać.")) {
                      regenerateCodeMut.mutate();
                    }
                  }}
                  disabled={regenerateCodeMut.isPending}
                  className="gap-1.5 border-brand-warm text-brand-dark-muted hover:text-brand hover:border-brand/30 text-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenerateCodeMut.isPending ? "animate-spin" : ""}`} />
                  {regenerateCodeMut.isPending ? "Generowanie..." : "Regeneruj kod"}
                </Button>
              </div>
            )}

            {!isOwner && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-blue-muted/30 border border-brand-blue/10">
                <Shield className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-dark-muted">
                  Tylko właściciel zespołu może regenerować kod zaproszenia.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-4">Ustawienia grafiku</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Godzina otwarcia</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={openHour}
                      onChange={(e) => setOpenHour(parseInt(e.target.value) || 0)}
                      className="w-20 border-brand-warm focus:border-brand focus:ring-brand/20"
                    />
                    <span className="text-sm text-brand-dark-muted">:00</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Godzina zamknięcia</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={closeHour}
                      onChange={(e) => setCloseHour(parseInt(e.target.value) || 22)}
                      className="w-20 border-brand-warm focus:border-brand focus:ring-brand/20"
                    />
                    <span className="text-sm text-brand-dark-muted">:00</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-brand-dark-soft mt-2">
                Domyślny zakres godzin widoczny na paskach dostępności i w kalendarzu
              </p>
            </div>

            <div className="border-t border-brand-warm pt-5">
              <h3 className="text-xs font-medium text-brand-dark-muted mb-3">Długość zmiany</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-brand-dark-muted mb-1.5 block">Minimalna (minuty)</label>
                  <Input
                    type="number"
                    min={60}
                    max={1440}
                    step={30}
                    value={minShiftMin}
                    onChange={(e) => setMinShiftMin(parseInt(e.target.value) || 240)}
                    className="border-brand-warm focus:border-brand focus:ring-brand/20"
                  />
                  <p className="text-[10px] text-brand-dark-soft mt-1">{Math.floor(minShiftMin / 60)}h {minShiftMin % 60 > 0 ? `${minShiftMin % 60}min` : ""}</p>
                </div>
                <div>
                  <label className="text-xs text-brand-dark-muted mb-1.5 block">Maksymalna (minuty)</label>
                  <Input
                    type="number"
                    min={60}
                    max={1440}
                    step={30}
                    value={maxShiftMin}
                    onChange={(e) => setMaxShiftMin(parseInt(e.target.value) || 720)}
                    className="border-brand-warm focus:border-brand focus:ring-brand/20"
                  />
                  <p className="text-[10px] text-brand-dark-soft mt-1">{Math.floor(maxShiftMin / 60)}h {maxShiftMin % 60 > 0 ? `${maxShiftMin % 60}min` : ""}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-warm">
              <Button
                onClick={handleSaveSchedule}
                disabled={updateSettingsMut.isPending}
                className="gap-1.5 bg-brand hover:bg-brand-light text-white text-sm"
              >
                <Save className="h-3.5 w-3.5" />
                Zapisz
              </Button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-brand-dark text-sm mb-1">Preferencje powiadomień</h2>
              <p className="text-xs text-brand-dark-muted mb-5">
                Skonfiguruj, które powiadomienia wewnętrzne są włączone dla zespołu.
              </p>

              <div className="space-y-4">
                <ToggleSwitch
                  checked={notifyAssigned}
                  onChange={setNotifyAssigned}
                  label="Przypisanie do zmiany"
                  description="Powiadomienie gdy pracownik zostanie przypisany do zmiany"
                />
                <ToggleSwitch
                  checked={notifyPublished}
                  onChange={setNotifyPublished}
                  label="Publikacja grafiku"
                  description="Powiadomienie gdy grafik tygodniowy zostanie opublikowany"
                />
                <ToggleSwitch
                  checked={notifyMarket}
                  onChange={setNotifyMarket}
                  label="Giełda zmian"
                  description="Powiadomienie o nowych zmianach dostępnych na giełdzie"
                />
                <ToggleSwitch
                  checked={notifyAnnounce}
                  onChange={setNotifyAnnounce}
                  label="Ogłoszenia"
                  description="Powiadomienie o nowych ogłoszeniach zespołowych"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-warm">
              <Button
                onClick={handleSaveNotifications}
                disabled={updateSettingsMut.isPending}
                className="gap-1.5 bg-brand hover:bg-brand-light text-white text-sm"
              >
                <Save className="h-3.5 w-3.5" />
                Zapisz
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
