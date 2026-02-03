"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { 
  type PushSubscriber, 
  sendTestPushNotification 
} from "@/app/actions/superuser";

interface PushTestFormProps {
  subscribers: PushSubscriber[];
}

export function PushTestForm({ subscribers }: PushTestFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Filter subscribers
  const filteredSubscribers = subscribers.filter(sub => 
    (sub.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     sub.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayedSubscribers = filteredSubscribers.slice(0, visibleCount);
  const selectedUser = subscribers.find((s) => s.id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !title || !body) return;

    setResult(null);
    
    startTransition(async () => {
      const res = await sendTestPushNotification(selectedUserId, title, body);
      if (res.success) {
        setResult({ success: true, message: `Successfully sent to ${res.count ?? 1} device(s).` });
        setTitle("");
        setBody("");
      } else {
        setResult({ success: false, message: res.error || "Failed to send notification." });
      }
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* User Selection (List) */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Target User</label>
                <span className="text-xs text-zinc-500">
                    Total: {subscribers.length} (Filtered: {filteredSubscribers.length})
                </span>
            </div>
          
            {/* Search Input */}
            <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(10); }}
                className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />

            {/* User List */}
            <div className="h-64 overflow-y-auto border border-zinc-700 rounded-lg bg-zinc-950 divide-y divide-zinc-800">
                {displayedSubscribers.map((sub) => (
                    <div 
                        key={sub.id} 
                        onClick={() => setSelectedUserId(sub.id)}
                        className={`p-3 cursor-pointer transition flex items-center justify-between ${
                            selectedUserId === sub.id 
                                ? "bg-blue-900/30 text-blue-100" 
                                : "hover:bg-zinc-900 text-zinc-300"
                        }`}
                    >
                        <div>
                            <p className="font-medium text-sm">{sub.full_name || "Unknown"}</p>
                            <p className="text-xs opacity-70">{sub.email}</p>
                        </div>
                        <div className="text-right">
                             <span className="text-xs bg-zinc-800 px-2 py-1 rounded-full border border-zinc-700">
                                {sub.subscription_count} devices
                            </span>
                        </div>
                    </div>
                ))}
                
                {filteredSubscribers.length === 0 && (
                     <div className="p-4 text-center text-zinc-500 text-sm">
                        No users found.
                    </div>
                )}
                
                {filteredSubscribers.length > visibleCount && (
                     <div 
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="p-3 text-center text-blue-400 text-sm hover:bg-zinc-900 cursor-pointer font-medium"
                     >
                        Load More (+10)
                    </div>
                )}
            </div>
            {selectedUser && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Selected: {selectedUser.full_name || selectedUser.email}
                </p>
            )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Test Notification"
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g., Hello, this is a test message!"
            rows={3}
            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            required
          />
        </div>

        {/* Status Message */}
        {result && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            result.success ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
          }`}>
            {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{result.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || !selectedUserId}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Test Notification
            </>
          )}
        </button>
      </form>
    </div>
  );
}
