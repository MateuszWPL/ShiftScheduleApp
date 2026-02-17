"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, uploadAvatar, updateUserProfile, User, getAvatarUrl } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Lock, User as UserIcon, Phone, Mail, Upload, X, Info, Camera } from "lucide-react";

export default function ProfilePage() {
  const { dbUser, currentUser, invalidateQueries } = useDashboardUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: !!dbUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const user = (profile || currentUser || dbUser) as User | undefined;
  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name || "");
      setPhoneNumber("phoneNumber" in user ? (user.phoneNumber || "") : "");
      setAvatarPreview(null);
      setSelectedFile(null);
    }
  }, [user, isEditing]);

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      toast.success("Zdjęcie zostało wgrane!");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setAvatarPreview(null);
      setSelectedFile(null);
    },
    onError: (err: Error) => toast.error("Błąd wgrywania zdjęcia", { description: err.message }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      toast.error("Nieprawidłowy typ pliku", { description: "Wybierz JPG, PNG, GIF lub WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Plik jest zbyt duży", { description: "Maks. 5MB" });
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateProfileMutation = useMutation({
    mutationFn: () => updateUserProfile(name, phoneNumber),
    onSuccess: () => {
      invalidateQueries();
      setIsEditing(false);
      toast.success("Profil zaktualizowany!");
    },
    onError: (err: Error) => toast.error("Błąd aktualizacji", { description: err.message }),
  });

  const isEmployee = user?.role === "EMPLOYEE";

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-brand-dark/40">
        <div className="inline-flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
          Ładowanie profilu...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-brand-dark truncate">Mój Profil</h1>
            <p className="text-[11px] sm:text-xs text-brand-dark/40 hidden sm:block">Zarządzaj danymi swojego konta</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-brand hover:bg-brand-light text-white flex-shrink-0"
            size="sm"
          >
            Edytuj
          </Button>
        )}
      </div>

      {/* Avatar card */}
      <div className="bg-white border border-brand-warm/40 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <Avatar
              src={avatarPreview || getAvatarUrl(user.avatarUrl) || undefined}
              name={user.name}
              size="xl"
            />
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-brand-light transition-colors"
                  title="Zmień zdjęcie"
                >
                  <Camera className="h-4 w-4" />
                </label>
              </>
            )}
          </div>

          {/* Upload controls (show below avatar on mobile when file selected) */}
          {isEditing && selectedFile && (
            <div className="w-full sm:hidden space-y-2 -mt-1">
              <p className="text-xs text-brand-dark/50 truncate text-center">{selectedFile.name}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={() => uploadAvatarMutation.mutate(selectedFile)}
                  disabled={uploadAvatarMutation.isPending}
                  className="bg-brand hover:bg-brand-light text-white"
                >
                  {uploadAvatarMutation.isPending ? "Wgrywanie..." : "Wgraj zdjęcie"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brand-dark/30 hover:text-brand-dark"
                  onClick={() => {
                    setAvatarPreview(null);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Info / form */}
          <div className="flex-1 w-full space-y-4 sm:space-y-5">
            {/* Desktop upload controls */}
            {isEditing && selectedFile && (
              <div className="hidden sm:block space-y-2">
                <p className="text-xs text-brand-dark/50 truncate">{selectedFile.name}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => uploadAvatarMutation.mutate(selectedFile)}
                    disabled={uploadAvatarMutation.isPending}
                    className="bg-brand hover:bg-brand-light text-white"
                  >
                    {uploadAvatarMutation.isPending ? "Wgrywanie..." : "Wgraj zdjęcie"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brand-dark/30 hover:text-brand-dark"
                    onClick={() => {
                      setAvatarPreview(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-[11px] sm:text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                <UserIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Imię i Nazwisko
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Imię i Nazwisko"
                  className="mt-1.5 border-brand-warm/60 focus:border-brand focus:ring-brand/20"
                />
              ) : (
                <p className="text-base sm:text-lg font-semibold text-brand-dark mt-1">{user.name}</p>
              )}
            </div>

            {/* Email */}
            {user.email && (
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                  <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Email
                </label>
                <div className="mt-1 flex items-center gap-2 min-w-0">
                  <p className="text-sm sm:text-lg text-brand-dark truncate">{user.email}</p>
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand-dark/20 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-brand-dark/30 mt-0.5">Email nie może być zmieniony</p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="text-[11px] sm:text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Numer telefonu
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+48 000 000 000"
                  className="mt-1.5 border-brand-warm/60 focus:border-brand focus:ring-brand/20"
                />
              ) : (
                <p className="text-sm sm:text-lg text-brand-dark mt-1">
                  {"phoneNumber" in user ? (user.phoneNumber || "Nie podano") : "Nie podano"}
                </p>
              )}
            </div>

            {/* Skills */}
            {isEmployee && (
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-brand-dark/40 uppercase tracking-wider">Umiejętności</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.skills?.length ? (
                    user.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="text-[11px] sm:text-xs bg-brand-blue-muted text-brand-blue px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-brand-dark/40 text-sm">Brak umiejętności</p>
                  )}
                </div>
                <p className="text-[10px] text-brand-dark/30 mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  Tylko administrator może zmienić umiejętności
                </p>
              </div>
            )}

            {/* Save / Cancel */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-brand-warm/20">
                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="bg-brand hover:bg-brand-light text-white w-full sm:w-auto"
                >
                  {updateProfileMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-brand-dark/50 hover:text-brand-dark w-full sm:w-auto"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name || "");
                    setPhoneNumber("phoneNumber" in user ? (user.phoneNumber || "") : "");
                    setAvatarPreview(null);
                    setSelectedFile(null);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role badge - always visible */}
      <div className="bg-white border border-brand-warm/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-medium text-brand-dark/40 uppercase tracking-wider">Rola w zespole</p>
            <p className="text-sm sm:text-base font-semibold text-brand-dark mt-1">
              {user.role === "OWNER" ? "Właściciel" : user.role === "MANAGER" ? "Menedżer" : "Pracownik"}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "OWNER"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : user.role === "MANAGER"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {user.role === "OWNER" ? "Owner" : user.role === "MANAGER" ? "Manager" : "Employee"}
          </div>
        </div>
      </div>
    </div>
  );
}
