"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updatePlatformBankAccount, updateRefundPolicy } from "@/app/actions/superuser";
import type { BankAccountInfo, RefundRule } from "@/app/actions/points";

interface SettingsFormProps {
  bankAccount: BankAccountInfo | null;
  refundRules: RefundRule[];
}

export function SettingsForm({ bankAccount, refundRules: initialRules }: SettingsFormProps) {
  const t = useTranslations("admin.settings");
  
  const [bank, setBank] = useState(bankAccount?.bank || "");
  const [account, setAccount] = useState(bankAccount?.account || "");
  const [holder, setHolder] = useState(bankAccount?.holder || "");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  
  const [rules, setRules] = useState<RefundRule[]>(
    initialRules.length > 0 ? initialRules : [{ hoursBeforeMatch: 24, refundPercent: 100 }]
  );
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  const handleSaveBank = async () => {
    setBankSaving(true);
    setBankSaved(false);
    await updatePlatformBankAccount({ bank, account, holder });
    setBankSaving(false);
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2000);
  };

  const handleSavePolicy = async () => {
    setPolicySaving(true);
    setPolicySaved(false);
    await updateRefundPolicy(rules);
    setPolicySaving(false);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2000);
  };

  const addRule = () => {
    setRules([...rules, { hoursBeforeMatch: 0, refundPercent: 0 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof RefundRule, value: number) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
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

      {/* 환불 정책 설정 */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">{t("refundPolicy")}</h2>
        <p className="text-sm text-zinc-400 mb-4">
          경기 시작 기준 시간별 환불 비율을 설정합니다. 숫자가 큰 시간부터 적용됩니다.
        </p>

        {/* Fixed Policy Notice */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-blue-400 font-bold mb-1">📢 기본 환불 정책 (시스템 고정)</h3>
          <p className="text-zinc-300 text-sm">
            경기 전일 23:59:59 (자정)까지 취소 시 <span className="text-white font-bold">100% 자동 환불</span>됩니다.
            <br />
            아래 설정은 <span className="text-amber-400">경기 당일</span>에 적용될 환불 규정입니다.
          </p>
        </div>
        
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-900 p-3 rounded-lg">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={rule.hoursBeforeMatch}
                  onChange={(e) => updateRule(i, "hoursBeforeMatch", parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100 text-center"
                />
                <span className="text-zinc-400 text-sm">{t("hoursLabel")}</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={rule.refundPercent}
                  onChange={(e) => updateRule(i, "refundPercent", parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-zinc-100 text-center"
                />
                <span className="text-zinc-400 text-sm">{t("percentLabel")}</span>
              </div>
              <button
                onClick={() => removeRule(i)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={addRule}
            className="px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
          >
            + {t("addRule")}
          </button>
          <button
            onClick={handleSavePolicy}
            disabled={policySaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
          >
            {policySaving ? "..." : policySaved ? "✓ " + t("saved") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
