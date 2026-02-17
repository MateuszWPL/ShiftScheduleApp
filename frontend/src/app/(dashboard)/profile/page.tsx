"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, uploadAvatar, updateUserProfile, User, getAvatarUrl } from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Lock, User as UserIcon, Phone, Mail, Upload, X, Info } from "lucide-react";

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Mój Profil</h1>
            <p className="text-xs text-brand-dark/40">Zarządzaj danymi swojego konta</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-brand hover:bg-brand-light text-white">
            Edytuj
          </Button>
        )}
      </div>

      <div className="bg-white border border-brand-warm/40 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <Avatar
              src={avatarPreview || getAvatarUrl(user.avatarUrl) || undefined}
              name={user.name}
              size="xl"
            />
            {isEditing && (
              <div className="mt-4 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button type="button" size="sm" variant="outline" className="w-full cursor-pointer border-brand-warm/60 hover:bg-brand-warm-light" asChild>
                    <span><Upload className="h-4 w-4 mr-2" /> Wybierz zdjęcie</span>
                  </Button>
                </label>
                {selectedFile && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-brand-dark/50 truncate">{selectedFile.name}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => uploadAvatarMutation.mutate(selectedFile)}
                        disabled={uploadAvatarMutation.isPending}
                        className="flex-1 bg-brand hover:bg-brand-light text-white"
                      >
                        {uploadAvatarMutation.isPending ? "Wgrywanie..." : "Wgraj"}
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
              </div>
            )}
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <label className="text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                <UserIcon className="h-3.5 w-3.5" /> Imię i Nazwisko
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
                <p className="text-lg font-semibold text-brand-dark mt-1">{user.name}</p>
              )}
            </div>
            {user.email && (
              <div>
                <label className="text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg text-brand-dark">{user.email}</p>
                  <Lock className="h-3.5 w-3.5 text-brand-dark/20" />
                </div>
                <p className="text-[10px] text-brand-dark/30 mt-0.5">Email nie może być zmieniony</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-brand-dark/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Phone className="h-3.5 w-3.5" /> Numer telefonu
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
                <p className="text-lg text-brand-dark mt-1">{"phoneNumber" in user ? (user.phoneNumber || "Nie podano") : "Nie podano"}</p>
              )}
            </div>
            {isEmployee && (
              <div>
                <label className="text-xs font-medium text-brand-dark/40 uppercase tracking-wider">Umiejętności</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.skills?.length ? (
                    user.skills.map((skill: string, idx: number) => (
                      <span key={idx} className="text-xs bg-brand-blue-muted text-brand-blue px-2.5 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-brand-dark/40 text-sm">Brak umiejętności</p>
                  )}
                </div>
                <p className="text-[10px] text-brand-dark/30 mt-1.5 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Tylko administrator może zmienić umiejętności
                </p>
              </div>
            )}
            {isEditing && (
              <div className="flex gap-2 pt-4 border-t border-brand-warm/20">
                <Button
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                  className="bg-brand hover:bg-brand-light text-white"
                >
                  Zapisz zmiany
                </Button>
                <Button
                  variant="ghost"
                  className="text-brand-dark/50 hover:text-brand-dark"
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
    </div>
  );
}
