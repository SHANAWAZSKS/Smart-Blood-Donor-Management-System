export type MatchInputs = {
  bloodGroupMatch: boolean;
  distanceKm: number;
  eligible: boolean;
  available: boolean;
};

const compatibleDonors: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function canDonateTo(donorGroup: string, recipientGroup: string) {
  return compatibleDonors[recipientGroup]?.includes(donorGroup) ?? false;
}

export function calculateMatchScore({ bloodGroupMatch, distanceKm, eligible, available }: MatchInputs) {
  if (!eligible || !available || !bloodGroupMatch) return 0;
  const distanceScore = Math.max(0, 24 - Math.round(distanceKm * 3));
  return Math.min(99, 58 + distanceScore);
}
