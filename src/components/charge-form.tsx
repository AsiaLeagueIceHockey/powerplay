"use client";
import { buttonStyles, fieldStyles, surfaceStyles } from "@/components/ui/styles";

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
      <div className="bg-pp-success-soft border border-pp-success-border rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-pp-success-text mb-2">
          {locale === "ko" ? "충전 신청 완료!" : "Charge Request Submitted!"}
        </h2>
        <p className="text-pp-success-text ">
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
        <div id="charge-error" role="alert" className="p-4 bg-pp-danger-soft border border-pp-danger-border text-pp-danger-text rounded-lg">
          {error}
        </div>
      )}

      {/* 빠른 선택 */}
      <div>
        <label className="block text-sm font-medium mb-3 text-pp-muted ">
          {t("quickAmounts")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleQuickAmount(value)}
              aria-pressed={amount === value && !customAmount}
              className={buttonStyles({ variant: amount === value && !customAmount ? "points" : "outline" })}
            >
              {value.toLocaleString()}{currencyUnit}
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      <div>
        <label htmlFor="charge-custom-amount" className="pp-field-label mb-2 block">
          {t("customAmount")}
        </label>
        <div className="relative">
          <input
            type="text"
            id="charge-custom-amount"
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => handleCustomAmount(e.target.value)}
            placeholder="0"
            className={`${fieldStyles()} w-full `}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pp-muted">{currencyUnit}</span>
        </div>
      </div>

      {/* 선택된 금액 표시 */}
      <div className="bg-pp-warning-soft p-4 rounded-lg">
        <p className="text-sm text-pp-warning-text ">{t("amount")}</p>
        <p className="text-3xl font-bold text-pp-warning-text ">
          {amount.toLocaleString()}{currencyUnit}
        </p>
      </div>

      {/* 입금 계좌 */}
      {bankAccount && bankAccount.bank && (
        <div>
          <label className="block text-sm font-medium mb-2 text-pp-muted ">
            {t("bankAccount")}
          </label>
          <div className={surfaceStyles({ density: "compact" })}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-m">
                  {bankAccount.bank} {bankAccount.account}
                </p>
                <p className="text-sm text-pp-muted">{bankAccount.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const copyText = `${bankAccount.bank} ${bankAccount.account}`;
                  navigator.clipboard.writeText(copyText).then(() => {
                    alert(locale === "ko" ? "계좌번호가 복사되었습니다!" : "Account copied!");
                  });
                }}
                className={`${buttonStyles({ variant: "secondary", size: "compact" })} flex-shrink-0`}
              >
                📋 {locale === "ko" ? "복사" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 입금자명 */}
      <div>
        <label htmlFor="charge-depositor-name" className="pp-field-label mb-2 block">
          {t("depositorName")} *
        </label>
        <input
          type="text"
          id="charge-depositor-name"
          aria-describedby={error ? "charge-error" : undefined}
          value={depositorName}
          onChange={(e) => setDepositorName(e.target.value)}
          placeholder={t("depositorNamePlaceholder")}
          required
          className={`${fieldStyles()} w-full`}
        />
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-pp-accent-soft border border-pp-accent rounded-lg text-sm text-pp-accent-text ">
        💡 {t("note")}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting || amount < 1000}
        className={`${buttonStyles({ variant: "points", size: "large" })} w-full`}
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
