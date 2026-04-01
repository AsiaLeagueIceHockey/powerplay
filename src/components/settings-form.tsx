"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updatePlatformBankAccount } from "@/app/actions/superuser";
import type { BankAccountInfo } from "@/app/actions/points";

interface SettingsFormProps {
  bankAccount: BankAccountInfo | null;
}

export function SettingsForm({ bankAccount }: SettingsFormProps) {
  const t = useTranslations("admin.settings");
  
  const [bank, setBank] = useState(bankAccount?.bank || "");
  const [account, setAccount] = useState(bankAccount?.account || "");
  const [holder, setHolder] = useState(bankAccount?.holder || "");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  const handleSaveBank = async () => {
    setBankSaving(true);
    setBankSaved(false);
    await updatePlatformBankAccount({ bank, account, holder });
    setBankSaving(false);
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 입금 계좌 설정 */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">{t("bankAccount")}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">{t("bank")}</label>
            <input
              type="text"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="예: 카카오뱅크"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">{t("account")}</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="예: 3333-01-1234567"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-300">{t("holder")}</label>
            <input
              type="text"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveBank}
            disabled={bankSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {bankSaving ? "..." : bankSaved ? "✓ " + t("saved") : t("save")}
          </button>
        </div>
      </div>

      {/* 환불 정책 (시스템 고정) */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">{t("refundPolicy")}</h2>
        
        {/* Fixed Policy Notice */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-blue-400 font-bold mb-2">📢 기본 환불 정책 (시스템 고정)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold mt-0.5">✓</span>
              <p className="text-zinc-300">
                경기 전일 23:59:59 (자정)까지 취소 시: <span className="text-white font-bold">100% 자동 환불</span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold mt-0.5">!</span>
              <p className="text-zinc-300">
                경기 당일 취소 시: <span className="text-red-400 font-bold">환불 불가</span> (운영진 별도 문의)
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-4">
          * 환불 정책 변경이 필요한 경우 개발팀에 문의하세요.
        </p>
      </div>
    </div>
  );
}
