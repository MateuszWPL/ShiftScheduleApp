"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, uploadAvatar, updateUserProfile, User, getAvatarUrl } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Lock, User as UserIcon, Phone, Mail, Upload, X } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: !!session,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setName(profile.name || "");
      setPhoneNumber("phoneNumber" in profile ? (profile.phoneNumber || "") : "");
      setAvatarPreview(null);
      setSelectedFile(null);
    }
  }, [profile, isEditing]);

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (updatedProfile) => {
      toast.success("Zdjęcie zostało wgrane!");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setAvatarPreview(null);
      setSelectedFile(null);
    },
    onError: (err: Error) => {
      toast.error("Błąd wgrywania zdjęcia", { description: err.message });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Walidacja typu pliku
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      toast.error("Nieprawidłowy typ pliku", {
        description: "Wybierz plik obrazu (JPG, PNG, GIF lub WEBP)",
      });
      return;
    }

    // Walidacja rozmiaru (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Plik jest zbyt duży", {
        description: "Maksymalny rozmiar to 5MB",
      });
      return;
    }

    setSelectedFile(file);
    
    // Utworzenie preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadAvatarMutation.mutate(selectedFile);
    }
  };

  const handleRemovePreview = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: () => updateUserProfile(name, phoneNumber),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setIsEditing(false);
      toast.success("Profil zaktualizowany!");
    },
    onError: (err: Error) => {
      toast.error("Błąd aktualizacji profilu", { description: err.message });
    },
  });

  const isEmployee = profile && "role" in profile && profile.role === "EMPLOYEE";
  const isAdmin = profile && "role" in profile && (profile.role === "OWNER" || profile.role === "MANAGER");

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout
        userRole={undefined}
        userName={undefined}
        userAvatar={null}
        onLogout={logout}
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.message || String(error);
    if (errorMessage.includes("401") || errorMessage.includes("autoryzacji")) {
      return null;
    }
  }

  if (!profile) {
    return (
      <DashboardLayout
        userRole={undefined}
        userName={undefined}
        userAvatar={null}
        onLogout={logout}
      >
        <div className="text-center">Błąd ładowania profilu</div>
      </DashboardLayout>
    );
  }

  const user = profile as User | any;

  return (
    <DashboardLayout
      userRole={user.role}
      userName={user.name}
      userAvatar={getAvatarUrl(user.avatarUrl) || null}
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mój Profil</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edytuj</Button>
          )}
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <Avatar 
                  src={avatarPreview || getAvatarUrl(user.avatarUrl) || undefined} 
                  name={user.name} 
                  size="xl" 
                />
              </div>
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Wybierz zdjęcie
                      </span>
                    </Button>
                  </label>
                  {selectedFile && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 truncate">
                        {selectedFile.name}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleUpload}
                          disabled={uploadAvatarMutation.isPending}
                          className="flex-1"
                        >
                          {uploadAvatarMutation.isPending ? "Wgrywanie..." : "Wgraj"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRemovePreview}
                          disabled={uploadAvatarMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Imię i Nazwisko
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Imię i Nazwisko"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg font-semibold mt-1">{user.name}</p>
                )}
              </div>

              {user.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg">{user.email}</p>
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email nie może być zmieniony
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Numer telefonu
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+48 000 000 000"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-lg mt-1">{"phoneNumber" in user ? (user.phoneNumber || "Nie podano") : "Nie podano"}</p>
                )}
              </div>


              {isEmployee && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Umiejętności</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">Brak umiejętności</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tylko administrator może zmienić umiejętności
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => updateProfileMutation.mutate()}
                    disabled={updateProfileMutation.isPending}
                  >
                    Zapisz zmiany
                  </Button>
                  <Button
                    variant="ghost"
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
        </Card>
      </div>
    </DashboardLayout>
  );
}

