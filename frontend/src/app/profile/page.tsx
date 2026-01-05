"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateUserAvatar, updateMyProfile, User } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Lock, User as UserIcon, Phone, Mail, DollarSign, Clock } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    enabled: !!session, // Pobierz profil tylko gdy jest sesja
    retry: false, // Nie próbuj ponownie przy błędzie 401
  });

  useEffect(() => {
    if (profile) {
      setPhoneNumber("phoneNumber" in profile ? (profile.phoneNumber || "") : "");
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile]);

  const updateAvatarMutation = useMutation({
    mutationFn: (url: string) => updateUserAvatar(url),
    onSuccess: (updatedProfile) => {
      toast.success("Avatar zaktualizowany!");
      queryClient.setQueryData(["my-profile"], updatedProfile);
      if (updatedProfile && "avatarUrl" in updatedProfile) {
        setAvatarUrl(updatedProfile.avatarUrl || null);
      }
    },
    onError: (err: Error) => {
      toast.error("Błąd aktualizacji avatara", { description: err.message });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: () => updateMyProfile(phoneNumber, avatarUrl || undefined),
    onSuccess: (updatedProfile) => {
      toast.success("Profil zaktualizowany!");
      queryClient.setQueryData(["my-profile"], updatedProfile);
      setIsEditing(false);
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
      userAvatar={user.avatarUrl}
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
              <Avatar src={avatarUrl || user.avatarUrl} name={user.name} size="xl" />
              {isEditing && (
                <div className="mt-4 space-y-2">
                  <Input
                    type="url"
                    placeholder="URL do zdjęcia"
                    value={avatarUrl || ""}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (avatarUrl) {
                        updateAvatarMutation.mutate(avatarUrl);
                      }
                    }}
                    disabled={updateAvatarMutation.isPending}
                  >
                    Zapisz avatar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Imię i Nazwisko
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-semibold">{user.name}</p>
                  {isEmployee && <Lock className="h-4 w-4 text-gray-400" />}
                </div>
                {isEmployee && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tylko administrator może zmienić imię i nazwisko
                  </p>
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

              {isAdmin && "hourlyRate" in user && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Stawka godzinowa
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg">
                      {user.hourlyRate ? `${user.hourlyRate} PLN/h` : "Nie ustawiono"}
                    </p>
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tylko administrator może zmienić stawkę
                  </p>
                </div>
              )}

              {isAdmin && "maxHours" in user && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Maksymalna liczba godzin
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-lg">
                      {user.maxHours ? `${user.maxHours} h/tydzień` : "Nie ustawiono"}
                    </p>
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tylko administrator może zmienić limit godzin
                  </p>
                </div>
              )}

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
                {isEmployee && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tylko administrator może zmienić umiejętności
                  </p>
                )}
              </div>

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
                      setPhoneNumber("phoneNumber" in user ? (user.phoneNumber || "") : "");
                      setAvatarUrl(user.avatarUrl || null);
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

