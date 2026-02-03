"use client";

import { useState, useTransition } from "react";
import { Search, ChevronRight, Edit2, Loader2, Save, X } from "lucide-react";
import { 
  getAllUserPoints, 
  getUserTransactionHistory, 
  updateUserPoints,
  type UserPointStatus, 
  type PointTransaction 
} from "@/app/actions/superuser";

import { useTranslations, useLocale } from "next-intl";

interface PointStatusTabProps {
  initialUsers?: UserPointStatus[];
}

export function PointStatusTab({ initialUsers = [] }: PointStatusTabProps) {
  const t = useTranslations("admin.pointManagement");
  const locale = useLocale();
  const [users, setUsers] = useState<UserPointStatus[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserPointStatus | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [history, setHistory] = useState<PointTransaction[]>([]);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editReason, setEditReason] = useState("");
  const [isSaving, startSave] = useTransition();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    startSearch(async () => {
      const results = await getAllUserPoints(term);
      setUsers(results);
    });
  };

  const handleUserClick = async (user: UserPointStatus) => {
    setSelectedUser(user);
    setIsEditing(false);
    setIsHistoryLoading(true);
    const txs = await getUserTransactionHistory(user.id);
    setHistory(txs);
    setIsHistoryLoading(false);
  };

  const handleEditClick = () => {
    if (!selectedUser) return;
    setEditAmount(selectedUser.points);
    setEditReason("");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;
    
    startSave(async () => {
      const result = await updateUserPoints(selectedUser.id, editAmount, editReason);
      if (result.success) {
        // Refresh local state
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, points: editAmount } : u));
        setSelectedUser({ ...selectedUser, points: editAmount });
        
        // Refresh history
        const txs = await getUserTransactionHistory(selectedUser.id);
        setHistory(txs);
        
        setIsEditing(false);
        alert("Saved successfully.");
      } else {
        alert("Failed: " + result.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
      {/* Left: User List */}
      <div className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800 space-y-4">
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-xs text-zinc-300">
              <p>
                  사용자들의 충전 금액 현황을 확인합니다. 
                  <br/>
                  부득이한 경우, 충전 금액을 조정할 수 있습니다. 
                  <br/><br/>
                  푸시 알림을 설정한 사용자라면, 충전 금액 조정 시 푸시 알림이 발송됩니다.
              </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className={`p-4 cursor-pointer hover:bg-zinc-800 transition flex items-center justify-between ${
                    selectedUser?.id === user.id ? "bg-zinc-800 border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="font-medium text-white truncate">{user.full_name || "No Name"}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-blue-400">
                      {user.points.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Load More Trigger could go here if paginated */}
            </div>
          )}
        </div>
      </div>

      {/* Right: Details */}
      <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedUser.full_name}
                  <span className="text-sm font-normal text-zinc-400">({selectedUser.email})</span>
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-zinc-400 text-sm">{t("currentPoints")}:</span>
                  <span className="text-2xl font-bold text-white">{selectedUser.points.toLocaleString()} {locale === "ko" ? "원" : "KRW"}</span>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  {t("editPoints")}
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/50">
              {isEditing ? (
                <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 max-w-md mx-auto animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-lg font-bold text-white mb-4">{t("editPoints")}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">
                          {t("currentPoints")} ({locale === "ko" ? "원" : "KRW"})
                      </label>
                      <input 
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">{t("reason")}</label>
                      <textarea 
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="e.g. 시스템 오류로 인한 조정"
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none h-24"
                      />
                      <p className="text-xs text-orange-400 mt-1">{t("confirmHelper")}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       {t("save")}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-lg font-medium"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {t("history")}
                  </h3>
                  
                  {isHistoryLoading ? (
                    <div className="py-10 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 bg-zinc-800/50 rounded-lg border border-zinc-800">
                      {t("noHistory")}
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                                <tr>
                                    <th className="p-3 font-medium">Type</th>
                                    <th className="p-3 font-medium text-right">Amount</th>
                                    <th className="p-3 font-medium text-right">Balance</th>
                                    <th className="p-3 font-medium">Description</th>
                                    <th className="p-3 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {history.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-zinc-800/50">
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                ['charge', 'admin_charge'].includes(tx.type) ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-red-900/20 text-red-400 border-red-900'
                                            }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`p-3 text-right font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-300'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right text-zinc-400">
                                            {tx.balance_after.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-zinc-300 max-w-[200px] truncate" title={tx.description}>
                                            {tx.description}
                                        </td>
                                        <td className="p-3 text-right text-zinc-500 whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">Select a user to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
