"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Share2, ChevronLeft } from "lucide-react";
import Image from "next/image";

interface CardData {
  full_name: string;
  card_serial_number: number;
  card_issued_at: string;
  hockey_start_date: string | null;
  stick_direction: "LEFT" | "RIGHT" | string;
  primary_club_id: string | null;
  position: string | null;
  detailed_positions: string[] | null;
}

interface PlayerCardClientProps {
  initialData: {
    profile: CardData;
    club: { name: string; logo_url: string | null } | null;
  }
}

export default function PlayerCardClient({ initialData }: PlayerCardClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  
  const data = initialData.profile;
  const clubName = initialData.club?.name || "";
  const clubLogo = initialData.club?.logo_url || null;

  // Convert external logo to base64 to avoid cross-origin canvas tainting in html-to-image
  useEffect(() => {
    if (clubLogo) {
      // Proxy through Next.js image optimizer to bypass CORS issues on external images
      const proxiedUrl = `/_next/image?url=${encodeURIComponent(clubLogo)}&w=64&q=75`;
      fetch(proxiedUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => setLogoDataUrl(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch((err) => console.error("Failed to convert club logo to base64", err));
    }
  }, [clubLogo]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setSharing(true);
      const { toBlob } = await import("html-to-image");
      
      const blob = await toBlob(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2, // Reduced from 3 to improve performance
      });

      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], `powerplay_card_${data?.card_serial_number || 'new'}.png`, { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t("profile.card.shareTitle", { fallback: "My PowerPlay Player Card" }),
          text: t("profile.card.shareText", { fallback: "Check out my digital hockey card on PowerPlay!" }),
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error sharing card:", err);
      alert(t("common.error", { fallback: "오류가 발생했습니다." }));
    } finally {
      setSharing(false);
    }
  };

  if (!data) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center z-50 text-zinc-900 dark:text-white p-4">
        <p className="mb-4">Card data not found.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-lg text-white">Go Back</button>
      </div>
    );
  }

  const isGoalie =
    (data.detailed_positions?.length === 1 && data.detailed_positions[0] === "G") ||
    (!data.detailed_positions?.length && data.position === "G");
  const isLeftHanded = data.stick_direction === "LEFT";
  const imageSrc = isGoalie ? "/goalie.png" : "/player.svg";
  
  // Format dates and numbers
  const issuedDate = data.card_issued_at ? new Date(data.card_issued_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const serialNo = `#${String(data.card_serial_number || 0).padStart(4, '0')}`;
  
  const positionsDisplay = data.detailed_positions?.length 
    ? data.detailed_positions.join(", ") 
    : (data.position || "-");

  const shotDisplay = data.stick_direction === "LEFT" 
    ? t("profile.stick.left", { fallback: "Left" }) 
    : (data.stick_direction === "RIGHT" ? t("profile.stick.right", { fallback: "Right" }) : "-");

  const experienceDisplay = (() => {
    if (!data.hockey_start_date) return "-";
    const start = new Date(data.hockey_start_date);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years === 0 && months === 0) return t("profile.experience.lessThanMonth", { fallback: "1개월 미만" });
    if (years === 0) return `${months}개월`;
    if (months === 0) return `${years}년`;
    return `${years}년 ${months}개월`;
  })();

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-50 flex flex-col pt-safe px-4 pb-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors flex items-center"
        >
          <ChevronLeft className="w-6 h-6 mr-1" />
          <span className="font-semibold">{t("profile.card.myCard", { fallback: "나의 선수 카드" })}</span>
        </button>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        
        {/* The Actual Card */}
        <div 
          ref={cardRef}
          className="relative w-full max-w-sm aspect-[5/8] rounded-[24px] p-6 flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
          style={{
            background: "linear-gradient(145deg, #18181b 0%, #09090b 100%)", // sleek dark zinc
          }}
        >
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex justify-between items-start z-10 w-full mb-6 text-white">
            {/* Club info top-left */}
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg pr-3 pl-1.5 py-1.5 border border-white/10">
              {clubLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img crossOrigin="anonymous" src={logoDataUrl || clubLogo} alt="Team" width={24} height={24} className="rounded object-cover bg-white" />
              ) : (
                 <div className="w-6 h-6 bg-zinc-800 text-white rounded flex items-center justify-center font-bold text-xs">
                   {clubName ? clubName.charAt(0) : "P"}
                 </div>
              )}
              <span className="font-bold text-xs tracking-wide">{clubName || "PowerPlay"}</span>
            </div>
            
            {/* Serial Number top-right */}
            <div className="text-right pt-2">
              <div className="text-[9px] text-zinc-400 font-medium mb-0.5 uppercase tracking-wider">SERIAL</div>
              <div className="text-sm font-bold tracking-widest text-white">{serialNo}</div>
            </div>
          </div>

          {/* Name */}
          <div className="z-10 text-center mt-2 mb-6">
            <h2 className="text-4xl font-black text-white tracking-wide">
              {data.full_name}
            </h2>
          </div>

          {/* Middle Graphic */}
          <div className="flex-1 relative w-full flex justify-center items-center z-10 mb-6 drop-shadow-2xl">
             <div className="relative w-40 h-40">
               <Image 
                  src={imageSrc} 
                  alt="Player Graphic"
                  fill
                  className={`object-contain brightness-0 invert opacity-90 ${isLeftHanded && !isGoalie ? 'scale-x-[-1]' : ''}`}
                  priority
                  unoptimized // Bypass Next.js image optimization for reliable export
                />
             </div>
          </div>

          {/* Details Grid */}
          <div className="z-10 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mt-auto">
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div>
                <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Position</div>
                <div className="text-sm font-bold text-white">{positionsDisplay}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Shot</div>
                <div className="text-sm font-bold text-white">{shotDisplay}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Experience</div>
                <div className="text-sm font-bold text-white">{experienceDisplay}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Issued Date</div>
                <div className="text-sm font-bold text-white">{issuedDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Button Placeholder outside card */}
        <div className="w-full max-w-sm mt-8">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg disabled:opacity-70 transition-transform active:scale-95"
            style={{
              background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)", // Blue share button matches new premium theme better
            }}
          >
            {sharing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                {t("profile.card.share", { fallback: "공유하기" })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
