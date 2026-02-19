
import { describe, it, expect } from "vitest";

// ==========================================
// Waitlist Logic Helpers (Reflecting server implementation)
// ==========================================

// Logic from promoteWaitlistUser
export const calculatePromotionCost = (
  entryPoints: number,
  rentalFee: number,
  isRentalOptIn: boolean,
  isGoalie: boolean,
  isGoalieFree: boolean
) => {
  const baseEntryPoints = (isGoalie && isGoalieFree) ? 0 : entryPoints;
  const rental = isRentalOptIn ? rentalFee : 0;
  return baseEntryPoints + rental;
};

// Logic from promoteWaitlistUser for status
export const determinePromotionStatus = (
  totalCost: number,
  userPoints: number
): "confirmed" | "pending_payment" => {
  if (totalCost === 0) return "confirmed";
  return userPoints >= totalCost ? "confirmed" : "pending_payment";
};

describe("Waitlist Rental Promotion Logic", () => {
    
  describe("1. Promotion Cost Calculation", () => {
    it("Standard Skater: Entry + Rental", () => {
        // Entry 20k, Rental 10k, Opt-in -> 30k
        const cost = calculatePromotionCost(20000, 10000, true, false, false);
        expect(cost).toBe(30000);
    });

    it("Standard Skater: Entry Only (No Rental)", () => {
        // Entry 20k, Rental 10k, No Opt-in -> 20k
        const cost = calculatePromotionCost(20000, 10000, false, false, false);
        expect(cost).toBe(20000);
    });

    it("Goalie Free: Entry=0, Rental=10k (Opt-in)", () => {
        // Goalie Free, Rental Opt-in -> 10k
        const cost = calculatePromotionCost(20000, 10000, true, true, true);
        expect(cost).toBe(10000);
    });

    it("Goalie Free: Entry=0, Rental=0 (No Opt-in)", () => {
        // Goalie Free, No Rental -> 0
        const cost = calculatePromotionCost(20000, 10000, false, true, true);
        expect(cost).toBe(0);
    });
  });

  describe("2. Promotion Status Check", () => {
    it("Sufficient Points (Entry + Rental)", () => {
        // Cost 30k, User have 30k -> Confirmed
        const status = determinePromotionStatus(30000, 30000);
        expect(status).toBe("confirmed");
    });

    it("Insufficient Points (Has Entry, lacks Rental)", () => {
        // Cost 30k (20+10), User have 25k -> Pending
        const status = determinePromotionStatus(30000, 25000);
        expect(status).toBe("pending_payment");
    });

    it("Insufficient Points (Has nothing)", () => {
        // Cost 30k, User have 0 -> Pending
        const status = determinePromotionStatus(30000, 0);
        expect(status).toBe("pending_payment");
    });

    it("Zero Cost (Goalie Free + No Rental)", () => {
        // Cost 0 -> Confirmed
        const status = determinePromotionStatus(0, 0);
        expect(status).toBe("confirmed");
    });
  });

});
