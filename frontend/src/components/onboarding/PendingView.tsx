"use client";

import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  userName: string;
  onLogout: () => void;
}

export function PendingView({ userName, onLogout }: Props) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-yellow-50 rounded-full">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Czekasz na akceptację</h1>
          <p className="text-gray-600">
            Witaj, <span className="font-semibold">{userName}</span>!
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-left space-y-2">
          <div className="flex items-start gap-2">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Twoja prośba o dołączenie została wysłana
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Manager otrzyma powiadomienie i wkrótce rozpatrzy Twoją prośbę. 
                Gdy zostaniesz zaakceptowany, otrzymasz dostęp do grafiku zmian.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button variant="ghost" className="w-full" onClick={onLogout}>
            Wyloguj się
          </Button>
        </div>
      </div>
    </div>
  );
}

