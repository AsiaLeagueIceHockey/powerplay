
import { describe, it, expect } from "vitest";

// ==========================================
// 1. Logic Helpers (Mimicking server logic)
// ==========================================

// Logic from joinMatch
export const calculateJoinCost = (
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

// Logic from joinMatch for determining status
export const determineJoinStatus = (
  totalCost: number,
  userPoints: number
): "confirmed" | "pending_payment" => {
  if (totalCost === 0) return "confirmed";
  return userPoints >= totalCost ? "confirmed" : "pending_payment";
};

// Logic from cancelJoin for calculating refund
export const calculateRefund = (
  paidEntryPoints: number,
  paidRentalFee: number,
  refundPercent: number
): number => {
  const totalPaid = paidEntryPoints + paidRentalFee;
  return Math.floor((totalPaid * refundPercent) / 100);
};

// Logic from joinMatch for validating rental availability
export const validateRentalAvailability = (
  isRentalOptIn: boolean,
  isRentalAvailable: boolean
): string | null => {
  if (isRentalOptIn && !isRentalAvailable) {
    return "Equipment rental is not available for this match";
  }
  return null;
};


// ==========================================
// 2. Test Suites
// ==========================================

describe("Rental Payment Logic Defense", () => {
    
  describe("1. Join Match Cost Calculation", () => {
    it("Standard Skater: Entry + Rental", () => {
        const cost = calculateJoinCost(20000, 10000, true, false, false);
        expect(cost).toBe(30000); // 20k + 10k
    });

    it("Standard Skater: Entry Only (No Rental)", () => {
        const cost = calculateJoinCost(20000, 10000, false, false, false);
        expect(cost).toBe(20000); // 20k only
    });

    it("Goalie Free: Entry=0, Rental=10k (Opt-in)", () => {
        // Goalie is free for entry, but rental should still cost money
        const cost = calculateJoinCost(20000, 10000, true, true, true);
        expect(cost).toBe(10000); // 0 + 10k
    });

    it("Goalie Free: Entry=0, Rental=0 (No Opt-in)", () => {
        const cost = calculateJoinCost(20000, 10000, false, true, true);
        expect(cost).toBe(0); // Free
    });

    it("Paid Goalie: Entry + Rental (Goalie Free option OFF)", () => {
        const cost = calculateJoinCost(15000, 5000, true, true, false);
        expect(cost).toBe(20000); // 15k + 5k
    });
  });

  describe("2. Sufficient Points & Status Check", () => {
    it("Sufficient Points: User has more than Total", () => {
        const status = determineJoinStatus(30000, 50000);
        expect(status).toBe("confirmed");
    });

    it("Exact Points: User has exact amount", () => {
        const status = determineJoinStatus(30000, 30000);
        expect(status).toBe("confirmed");
    });

    it("Insufficient Points: User has less than Total", () => {
        const status = determineJoinStatus(30000, 29000);
        expect(status).toBe("pending_payment");
    });

    it("Insufficient Points: User has enough for Entry but not Rental", () => {
        // Entry 20k, Rental 10k = Total 30k. User has 25k.
        const status = determineJoinStatus(30000, 25000);
        expect(status).toBe("pending_payment");
    });

    it("Zero Cost: Always Confirmed regardless of points", () => {
        const status = determineJoinStatus(0, 0);
        expect(status).toBe("confirmed");
    });
  });

  describe("3. Cancellation Refund Logic", () => {
    it("Full Refund: 100% of Entry + Rental", () => {
        // Paid 20k entry + 10k rental = 30k total
        const refund = calculateRefund(20000, 10000, 100);
        expect(refund).toBe(30000);
    });

    it("Partial Refund: 50% of Entry + Rental", () => {
        // Paid 20k entry + 10k rental = 30k total
        const refund = calculateRefund(20000, 10000, 50);
        expect(refund).toBe(15000);
    });

    it("No Refund: 0%", () => {
        const refund = calculateRefund(20000, 10000, 0);
        expect(refund).toBe(0);
    });

    it("Refund for Rental Only (Goalie Free)", () => {
        // Entry 0, Rental 10k
        const refund = calculateRefund(0, 10000, 100);
        expect(refund).toBe(10000);
    });
  });

  describe("4. Rental Availability Validation", () => {
    it("Allowed: Optimization IN + Rental Available", () => {
        const error = validateRentalAvailability(true, true);
        expect(error).toBeNull();
    });

    it("Allowed: Optimization OUT + Rental Available", () => {
        const error = validateRentalAvailability(false, true);
        expect(error).toBeNull();
    });

    it("Allowed: Optimization OUT + Rental NOT Available", () => {
        const error = validateRentalAvailability(false, false);
        expect(error).toBeNull();
    });

    it("Blocked: Optimization IN + Rental NOT Available", () => {
        const error = validateRentalAvailability(true, false);
        expect(error).toBe("Equipment rental is not available for this match");
    });
  });
});
