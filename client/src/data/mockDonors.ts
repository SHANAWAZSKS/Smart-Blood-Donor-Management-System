/**
 * MOCK DONOR SEED DATA
 * ─────────────────────────────────────────────────────────────────────────────
 * This file is the ONLY place mock/demo donor data lives.
 * The coordinates are offsets relative to a supplied center point so the seed
 * works regardless of where the real user is located.
 *
 * TO REPLACE WITH REAL DATA:
 *   Remove this file and swap the import in `useLiveMap.ts` for an API call
 *   that returns donors in the same `MockDonor` shape.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type BloodGroupKey =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export interface MockDonor {
  donorId: string;
  name: string;
  bloodGroup: BloodGroupKey;
  /** Absolute latitude — computed from seed offset + user location at runtime */
  lat: number;
  /** Absolute longitude — computed from seed offset + user location at runtime */
  lng: number;
  availability: "Available now" | "Available today" | "Unavailable";
  lastUpdated: string; // ISO-8601
}

/**
 * Relative offsets (in degrees) so the mock donors always appear near the
 * user's real position.  1° latitude ≈ 111 km; 1° longitude ≈ 111 km × cos(lat).
 */
const SEED: Array<Omit<MockDonor, "lat" | "lng"> & { dLat: number; dLng: number }> = [
  { donorId: "D-001", name: "Aarav Mehta",     bloodGroup: "O+",  dLat:  0.0162, dLng:  0.0085, availability: "Available now",   lastUpdated: "2026-09-16T10:15:00Z" },
  { donorId: "D-002", name: "Diya Sharma",      bloodGroup: "A+",  dLat: -0.0105, dLng:  0.0224, availability: "Available today",  lastUpdated: "2026-09-16T08:00:00Z" },
  { donorId: "D-003", name: "Rohan Iyer",       bloodGroup: "O-",  dLat:  0.0374, dLng: -0.0158, availability: "Available now",   lastUpdated: "2026-09-16T11:30:00Z" },
  { donorId: "D-004", name: "Meera Nair",       bloodGroup: "B+",  dLat: -0.0218, dLng:  0.0372, availability: "Available today",  lastUpdated: "2026-09-15T20:45:00Z" },
  { donorId: "D-005", name: "Vikram Patel",     bloodGroup: "AB+", dLat:  0.0051, dLng: -0.0310, availability: "Unavailable",     lastUpdated: "2026-09-14T14:00:00Z" },
  { donorId: "D-006", name: "Ananya Reddy",     bloodGroup: "A-",  dLat:  0.0489, dLng:  0.0190, availability: "Available now",   lastUpdated: "2026-09-16T09:55:00Z" },
  { donorId: "D-007", name: "Kabir Singh",      bloodGroup: "B-",  dLat: -0.0340, dLng: -0.0275, availability: "Available now",   lastUpdated: "2026-09-16T07:10:00Z" },
  { donorId: "D-008", name: "Priya Krishnan",   bloodGroup: "AB-", dLat:  0.0287, dLng:  0.0453, availability: "Available today",  lastUpdated: "2026-09-15T18:30:00Z" },
  { donorId: "D-009", name: "Arjun Das",        bloodGroup: "O+",  dLat: -0.0132, dLng: -0.0480, availability: "Available now",   lastUpdated: "2026-09-16T12:05:00Z" },
  { donorId: "D-010", name: "Sania Hussain",    bloodGroup: "A+",  dLat:  0.0620, dLng: -0.0070, availability: "Unavailable",     lastUpdated: "2026-09-13T16:00:00Z" },
  { donorId: "D-011", name: "Ravi Teja",        bloodGroup: "B+",  dLat: -0.0560, dLng:  0.0315, availability: "Available today",  lastUpdated: "2026-09-15T22:00:00Z" },
  { donorId: "D-012", name: "Neha Gupta",       bloodGroup: "O-",  dLat:  0.0075, dLng:  0.0680, availability: "Available now",   lastUpdated: "2026-09-16T10:50:00Z" },
  { donorId: "D-013", name: "Aditya Joshi",     bloodGroup: "AB+", dLat: -0.0420, dLng: -0.0145, availability: "Available now",   lastUpdated: "2026-09-16T06:45:00Z" },
  { donorId: "D-014", name: "Sneha Pillai",     bloodGroup: "A-",  dLat:  0.0380, dLng: -0.0520, availability: "Unavailable",     lastUpdated: "2026-09-12T11:00:00Z" },
  { donorId: "D-015", name: "Manish Verma",     bloodGroup: "O+",  dLat: -0.0195, dLng:  0.0595, availability: "Available today",  lastUpdated: "2026-09-15T15:20:00Z" },
];

/**
 * Generate absolute donor coordinates from the user's current location.
 * Call this once when the user's position is known.
 */
export function generateDonorsNear(
  userLat: number,
  userLng: number
): MockDonor[] {
  return SEED.map((s) => ({
    donorId:      s.donorId,
    name:         s.name,
    bloodGroup:   s.bloodGroup,
    lat:          userLat + s.dLat,
    lng:          userLng + s.dLng,
    availability: s.availability,
    lastUpdated:  s.lastUpdated,
  }));
}
