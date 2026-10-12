/**
 * useLiveMap
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  • Browser geolocation (real, never faked)
 *  • Permission-denied / unsupported fallback with manual lat/lng override
 *  • Haversine distance calculation between user and each donor
 *  • Blood-group filtering
 *  • Donors sorted nearest-first
 *
 * Donor data comes from the mock seed (generateDonorsNear).
 * Swap that import for an API call when the backend is ready — the rest of
 * the hook stays unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateDonorsNear, type BloodGroupKey, type MockDonor } from "@/data/mockDonors";

// Re-export so consumers only need to import from this hook, not reach into mockDonors directly.
export type { BloodGroupKey };

// ── Types ────────────────────────────────────────────────────────────────────

export type GeoStatus =
  | "idle"        // not yet requested
  | "requesting"  // permission prompt open / GPS acquiring
  | "granted"     // position obtained
  | "denied"      // user denied or browser blocked
  | "unavailable" // navigator.geolocation not present
  | "manual";     // user entered coordinates manually

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number; // metres
}

export interface DonorWithDistance extends MockDonor {
  distanceKm: number;
}

export const ALL_BLOOD_GROUPS: BloodGroupKey[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

// ── Haversine ────────────────────────────────────────────────────────────────

/**
 * Returns the great-circle distance between two coordinates in kilometres.
 * Formula: Haversine (accurate to ~0.5 % for distances < 1 000 km).
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseLiveMapReturn {
  geoStatus: GeoStatus;
  userLocation: UserLocation | null;
  locationUpdatedAt: Date | null;

  /** All donors enriched with real distances, sorted nearest-first */
  allDonors: DonorWithDistance[];

  /** Subset after applying the active blood-group filter */
  filteredDonors: DonorWithDistance[];

  activeFilter: BloodGroupKey | "All";
  setFilter: (f: BloodGroupKey | "All") => void;

  /** Call when the user has typed / picked a manual location */
  setManualLocation: (lat: number, lng: number) => void;

  /** Re-request geolocation (e.g. after user grants permission in browser settings) */
  retryGeolocation: () => void;
}

export function useLiveMap(): UseLiveMapReturn {
  const [geoStatus, setGeoStatus]               = useState<GeoStatus>("idle");
  const [userLocation, setUserLocation]         = useState<UserLocation | null>(null);
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter]         = useState<BloodGroupKey | "All">("All");

  // ── Geolocation request ────────────────────────────────────────────────────
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationUpdatedAt(new Date());
        setGeoStatus("granted");
      },
      (err) => {
        // code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        console.warn("[useLiveMap] Geolocation error:", err.message);
        setGeoStatus(err.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  // ── Manual location override ───────────────────────────────────────────────
  const setManualLocation = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setLocationUpdatedAt(new Date());
    setGeoStatus("manual");
  }, []);

  // ── Donor data enriched with distances ────────────────────────────────────
  const allDonors = useMemo<DonorWithDistance[]>(() => {
    if (!userLocation) return [];
    // ── REPLACE THIS LINE when wiring to a real API ──────────────────────────
    const raw = generateDonorsNear(userLocation.lat, userLocation.lng);
    // ─────────────────────────────────────────────────────────────────────────
    return raw
      .map((d) => ({
        ...d,
        distanceKm: haversineKm(userLocation.lat, userLocation.lng, d.lat, d.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filteredDonors = useMemo<DonorWithDistance[]>(() => {
    if (activeFilter === "All") return allDonors;
    return allDonors.filter((d) => d.bloodGroup === activeFilter);
  }, [allDonors, activeFilter]);

  return {
    geoStatus,
    userLocation,
    locationUpdatedAt,
    allDonors,
    filteredDonors,
    activeFilter,
    setFilter: setActiveFilter,
    setManualLocation,
    retryGeolocation: requestGeolocation,
  };
}
