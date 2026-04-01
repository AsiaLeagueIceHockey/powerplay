"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { requestPointCharge, type BankAccountInfo } from "@/app/actions/points";

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000];

interface ChargeFormProps {
  bankAccount: BankAccountInfo | null;
  initialAmount?: number;
}

export function ChargeForm({ bankAccount, initialAmount = 30000 }: ChargeFormProps) {
  const t = useTranslations("points.chargeRequest");
  const locale = useLocale();
  const router = useRouter();
  
  // Use exact initialAmount (no rounding)
  const defaultAmount = initialAmount > 0 ? initialAmount : 30000;
  
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState(
    QUICK_AMOUNTS.includes(defaultAmount) ? "" : defaultAmount.toLocaleString()
  );
  const [depositorName, setDepositorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currencyUnit = locale === "ko" ? "원" : "KRW";

  const handleQuickAmount = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""));
    if (!isNaN(num)) {
      setCustomAmount(num.toLocaleString());
      setAmount(num);
    } else if (value === "") {
      setCustomAmount("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (amount < 1000) {
      setError(locale === "ko" ? "최소 1,000원 이상 충전해주세요" : "Minimum 1,000 KRW required");
      setIsSubmitting(false);
      return;
    }

    if (!depositorName.trim()) {
      setError(locale === "ko" ? "입금자명을 입력해주세요" : "Please enter depositor name");
      setIsSubmitting(false);
      return;
    }

    const result = await requestPointCharge(amount, depositorName.trim());

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(`/${locale}/mypage/points`);
    }, 2000);
  };

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
          {locale === "ko" ? "충전 신청 완료!" : "Charge Request Submitted!"}
        </h2>
        <p className="text-green-600 dark:text-green-300">
          {locale === "ko"
            ? "입금 확인 후 금액이 충전됩니다."
            : "Credits will be added after payment confirmation."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* 빠른 선택 */}
      <div>
        <label className="block text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">
          {t("quickAmounts")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleQuickAmount(value)}
              className={`py-3 px-4 rounded-lg border text-sm font-medium transition ${
                amount === value && !customAmount
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-300"
              }`}
            >
              {value.toLocaleString()}{currencyUnit}
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          {t("customAmount")}
        </label>
        <div className="relative">
          <input
            type="text"
            value={customAmount}
            onChange={(e) => handleCustomAmount(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">{currencyUnit}</span>
        </div>
      </div>

      {/* 선택된 금액 표시 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <p className="text-sm text-amber-700 dark:text-amber-300">{t("amount")}</p>
        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
          {amount.toLocaleString()}{currencyUnit}
        </p>
      </div>

      {/* 입금 계좌 */}
      {bankAccount && bankAccount.bank && (
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            {t("bankAccount")}
          </label>
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-m">
                  {bankAccount.bank} {bankAccount.account}
                </p>
                <p className="text-sm text-zinc-500">{bankAccount.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const copyText = `${bankAccount.bank} ${bankAccount.account}`;
                  navigator.clipboard.writeText(copyText).then(() => {
                    alert(locale === "ko" ? "계좌번호가 복사되었습니다!" : "Account copied!");
                  });
                }}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition flex items-center gap-1 whitespace-nowrap flex-shrink-0"
              >
                📋 {locale === "ko" ? "복사" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입금자명 */}
      <div>
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          {t("depositorName")} *
        </label>
        <input
          type="text"
          value={depositorName}
          onChange={(e) => setDepositorName(e.target.value)}
          placeholder={t("depositorNamePlaceholder")}
          required
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        💡 {t("note")}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting || amount < 1000}
        className="w-full py-4 bg-amber-500 text-white rounded-lg font-bold text-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
