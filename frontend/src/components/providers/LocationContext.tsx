"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLocations, Location } from "@/lib/api";

const STORAGE_KEY = "staffer:activeLocationId";

interface LocationContextValue {
  locations: Location[];
  activeLocationId: string | null;
  activeLocation: Location | null;
  setActiveLocationId: (id: string) => void;
  isLoading: boolean;
  refetchLocations: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

interface LocationProviderProps {
  children: ReactNode;
  /** Only fetch locations when user has Business+ plan */
  hasBusiness: boolean;
}

export function LocationProvider({ children, hasBusiness }: LocationProviderProps) {
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
    enabled: hasBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const [activeLocationId, setActiveLocationIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // When locations load, validate stored id; fall back to default
  useEffect(() => {
    if (!hasBusiness || locations.length === 0) return;

    const stored = activeLocationId;
    const valid = stored && locations.some((l) => l.id === stored);
    if (!valid) {
      const defaultLoc = locations.find((l) => l.isDefault) ?? locations[0];
      if (defaultLoc) {
        setActiveLocationIdState(defaultLoc.id);
        localStorage.setItem(STORAGE_KEY, defaultLoc.id);
      }
    }
  }, [locations, hasBusiness, activeLocationId]);

  const setActiveLocationId = useCallback((id: string) => {
    setActiveLocationIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refetchLocations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["locations"] });
  }, [queryClient]);

  const activeLocation =
    locations.find((l) => l.id === activeLocationId) ?? null;

  return (
    <LocationContext.Provider
      value={{
        locations,
        activeLocationId: hasBusiness ? activeLocationId : null,
        activeLocation: hasBusiness ? activeLocation : null,
        setActiveLocationId,
        isLoading,
        refetchLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}
