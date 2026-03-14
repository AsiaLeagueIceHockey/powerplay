/**
 * Bank account information structure
 */
export interface BankAccountParts {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

/**
 * Formats bank account parts into a single string for storage.
 * Format: "BankName AccountNumber AccountHolder" (matching the user's example: "카카오뱅크 3333-00-0000000 홍길동")
 */
export function formatBankAccount({ bankName, accountHolder, accountNumber }: BankAccountParts): string {
  if (!bankName && !accountHolder && !accountNumber) return "";
  return `${bankName.trim()} ${accountNumber.trim()} ${accountHolder.trim()}`;
}

/**
 * Parses a bank account string back into its parts.
 * Expected format: "[BankName] [AccountNumber] [AccountHolder]"
 */
export function parseBankAccount(bankAccount: string | null | undefined): BankAccountParts {
  if (!bankAccount) {
    return { bankName: "", accountHolder: "", accountNumber: "" };
  }

  // Split by whitespace
  const parts = bankAccount.trim().split(/\s+/);

  if (parts.length >= 3) {
    // If we have 3 or more parts, assume:
    // 1st part: Bank Name
    // Middle parts (if any) + second to last: Account Number (handling cases where number might have spaces, though unlikely)
    // Last part: Account Holder
    
    // In many Korean bank account formats, the last word is the name.
    const bankName = parts[0];
    const accountHolder = parts[parts.length - 1];
    const accountNumber = parts.slice(1, parts.length - 1).join(" ");
    
    return { bankName, accountHolder, accountNumber };
  } else if (parts.length === 2) {
    // Fallback for incomplete data
    return { bankName: parts[0], accountHolder: parts[1], accountNumber: "" };
  } else {
    // Fallback for single word or empty
    return { bankName: parts[0] || "", accountHolder: "", accountNumber: "" };
  }
}
