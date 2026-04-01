import { describe, it, expect } from "vitest";
import { formatBankAccount, parseBankAccount } from "@/lib/utils/bank-account";

describe("BankAccount Utility", () => {
  describe("formatBankAccount", () => {
    it("should format bank parts into a single string", () => {
      const parts = {
        bankName: "카카오뱅크",
        accountNumber: "3333-01-2345678",
        accountHolder: "홍길동",
      };
      expect(formatBankAccount(parts)).toBe("카카오뱅크 3333-01-2345678 홍길동");
    });

    it("should handle empty fields", () => {
      const parts = {
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      };
      expect(formatBankAccount(parts)).toBe("");
    });
  });

  describe("parseBankAccount", () => {
    it("should parse a correctly formatted string", () => {
      const raw = "카카오뱅크 3333-01-2345678 홍길동";
      const parts = parseBankAccount(raw);
      expect(parts.bankName).toBe("카카오뱅크");
      expect(parts.accountNumber).toBe("3333-01-2345678");
      expect(parts.accountHolder).toBe("홍길동");
    });

    it("should handle strings with multiple spaces", () => {
      const raw = "  신한은행   110-123-456789   이강인  ";
      const parts = parseBankAccount(raw);
      expect(parts.bankName).toBe("신한은행");
      expect(parts.accountNumber).toBe("110-123-456789");
      expect(parts.accountHolder).toBe("이강인");
    });

    it("should handle malformed strings gracefully", () => {
      expect(parseBankAccount("").bankName).toBe("");
      expect(parseBankAccount(null).bankName).toBe("");
      expect(parseBankAccount("카카오뱅크").bankName).toBe("카카오뱅크");
      expect(parseBankAccount("카카오뱅크 홍길동").accountHolder).toBe("홍길동");
    });
  });
});
