
import { describe, it, expect } from "vitest";

// ==========================================
// Logic Extracted from src/app/actions/admin.ts (AS-IS)
// ==========================================

// Logic from cancelMatchByAdmin / updateMatch (Current Buggy Implementation)
export const calculateAdminRefund_Buggy = (
  entryPoints: number,
  rentalFee: number,
  isRentalOptIn: boolean
) => {
  // Current code only adds entry_points
  return entryPoints; 
};

// Correct Logic we WANT
export const calculateAdminRefund_Correct = (
  entryPoints: number,
  rentalFee: number,
  isRentalOptIn: boolean
) => {
  const rental = isRentalOptIn ? rentalFee : 0;
  return entryPoints + rental;
};

describe("Admin Cancellation Refund Bug Reproduction", () => {
    
  it("BUG: Admin cancellation refunds ONLY entry points, missing rental fee", () => {
      const entryPoints = 20000;
      const rentalFee = 10000;
      const isRentalOptIn = true;

      // Current behavior
      const refund = calculateAdminRefund_Buggy(entryPoints, rentalFee, isRentalOptIn);
      
      // Expected Total Paid was 30,000
      // But current logic returns 20,000
      expect(refund).toBe(20000); 
      expect(refund).not.toBe(30000);
  });

  it("FIX: Correct logic should refund both", () => {
      const entryPoints = 20000;
      const rentalFee = 10000;
      const isRentalOptIn = true;

      const refund = calculateAdminRefund_Correct(entryPoints, rentalFee, isRentalOptIn);
      
      expect(refund).toBe(30000);
  });
});
