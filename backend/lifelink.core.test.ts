import { describe, expect, it } from "vitest";
import { calculateMatchScore, canDonateTo } from "../shared/lifelink";
import { appRouter } from "./routers";

const broadcastInput = {
  bloodGroup: "O+",
  units: 2,
  hospital: "St. Mary’s Medical Centre",
  radiusKm: 10,
  pushEnabled: true,
} as const;

const authenticatedContext = {
  user: {
    id: 1,
    openId: "hospital-user",
    name: "Hospital Admin",
    email: "admin@hospital.example",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as never,
  res: {} as never,
};

describe("LifeLink matching rules", () => {
  it("accepts compatible positive donor groups", () => {
    expect(canDonateTo("O-", "AB+")).toBe(true);
    expect(canDonateTo("O+", "O+")).toBe(true);
    expect(canDonateTo("A+", "O+")).toBe(false);
  });

  it("prioritizes eligible, available donors near the request", () => {
    const near = calculateMatchScore({ bloodGroupMatch: true, distanceKm: 1.8, eligible: true, available: true });
    const far = calculateMatchScore({ bloodGroupMatch: true, distanceKm: 4.7, eligible: true, available: true });
    expect(near).toBeGreaterThan(far);
    expect(calculateMatchScore({ bloodGroupMatch: true, distanceKm: 1, eligible: false, available: true })).toBe(0);
    expect(calculateMatchScore({ bloodGroupMatch: false, distanceKm: 1, eligible: true, available: true })).toBe(0);
  });

  it("creates a broadcast response for an authenticated hospital user", async () => {
    const result = await appRouter.createCaller(authenticatedContext).hospital.broadcast(broadcastInput);

    expect(result.status).toBe("broadcast");
    expect(result.pushQueued).toBe(true);
    expect(result.matchedDonors).toBeGreaterThan(0);
    expect(result.requestId).toMatch(/^REQ-/);
  });

  it("rejects an unauthenticated broadcast request", async () => {
    await expect(appRouter.createCaller({ user: null, req: {} as never, res: {} as never }).hospital.broadcast(broadcastInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("saves the requested account profile fields for an authenticated user", async () => {
    const profile = await appRouter.createCaller(authenticatedContext).profile.update({
      name: "Kavya Deshmukh",
      mobileNumber: "+91 98765 43210",
      bloodGroup: "O+",
      livingCity: "Hyderabad",
    });

    expect(profile).toMatchObject({ name: "Kavya Deshmukh", mobileNumber: "+91 98765 43210", bloodGroup: "O+", livingCity: "Hyderabad" });
  });

  it("rejects profile updates without authentication", async () => {
    await expect(appRouter.createCaller({ user: null, req: {} as never, res: {} as never }).profile.update({
      name: "Guest User",
      mobileNumber: "+91 98765 43210",
      bloodGroup: "O+",
      livingCity: "Hyderabad",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
