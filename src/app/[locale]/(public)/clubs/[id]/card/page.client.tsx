"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Share2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { extractRegion } from "@/lib/rink-utils";
import { Club } from "@/app/actions/types";

function paginateTextByLines(text: string, maxLines: number = 6): string[] {
  const charsPerLine = 23; // Conservative average of Korean characters per line width
  const pages: string[] = [];
  let currentPageContent = "";
  let currentLineCount = 0;
  
  const rawLines = text.split('\n');
  
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    
    // Ignore empty lines completely if we are in 4:5 mode (maxLines <= 2)
    if (maxLines <= 2 && line.trim().length === 0) {
      continue;
    }
    
    // Handle empty lines (explicit newlines)
    if (line.trim().length === 0) {
      if (currentLineCount + 1 > maxLines && currentPageContent.length > 0) {
        pages.push(currentPageContent.trimEnd());
        currentPageContent = "";
        currentLineCount = 0;
      }
      currentPageContent += "\n";
      currentLineCount += 1;
      continue;
    }
    
    // Process line string
    while (line.length > 0) {
      if (currentLineCount >= maxLines) {
        pages.push(currentPageContent.trimEnd());
        currentPageContent = "";
        currentLineCount = 0;
      }
      
      const linesAvailable = maxLines - currentLineCount;
      const charsAvailable = linesAvailable * charsPerLine;
      const visualLinesNeeded = Math.ceil(line.length / charsPerLine);
      
      if (visualLinesNeeded <= linesAvailable) {
        // Fits perfectly
        currentPageContent += line + (i < rawLines.length - 1 ? "\n" : "");
        currentLineCount += visualLinesNeeded;
        line = "";
      } else {
        // Needs splitting across pages
        let breakIndex = charsAvailable;
        const lastSpace = line.lastIndexOf(" ", breakIndex);
        if (lastSpace > charsAvailable * 0.7) {
          breakIndex = lastSpace;
        }
        
        currentPageContent += line.slice(0, breakIndex);
        pages.push(currentPageContent.trimEnd());
        currentPageContent = "";
        currentLineCount = 0;
        
        line = line.slice(breakIndex).trimStart();
      }
    }
  }
  
  if (currentPageContent.trimEnd().length > 0) {
    pages.push(currentPageContent.trimEnd());
  }
  
  return pages.length > 0 ? pages : [text];
}

interface ClubCardClientProps {
  club: Club;
}

export default function ClubCardClient({ club }: ClubCardClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [descPage, setDescPage] = useState(0);
  const [ratio, setRatio] = useState<'story' | 'post'>('story');

  useEffect(() => {
    if (!showFullDesc) setDescPage(0);
  }, [showFullDesc]);

  const descPages = club.description ? paginateTextByLines(club.description, ratio === 'post' ? 2 : 5) : [];

  // Convert external logo to base64 to avoid cross-origin canvas tainting in html-to-image
  useEffect(() => {
    if (club.logo_url) {
      const loadLogo = async () => {
        const fetchAsBase64 = async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const blob = await res.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        try {
          // Proxy through Next.js image optimizer to bypass CORS issues on external images
          const proxiedUrl = `/_next/image?url=${encodeURIComponent(club.logo_url!)}&w=256&q=75`;
          const base64 = await fetchAsBase64(proxiedUrl);
          setLogoDataUrl(base64);
        } catch (err) {
          console.warn("Failed to fetch image via proxy, falling back to direct URL", err);
          try {
            const base64 = await fetchAsBase64(club.logo_url!);
            setLogoDataUrl(base64);
          } catch (fallbackErr) {
            console.error("Failed to convert club logo to base64", fallbackErr);
          }
        }
      };
      
      loadLogo();
    }
  }, [club.logo_url]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setSharing(true);
      const { toBlob } = await import("html-to-image");
      
      // Longer delay to let the browser and Next.js Image component settle
      // This helps prevent missing logo issues by ensuring all DOM repaints especially external images have finished
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let blob: Blob | null = null;
      let retries = 3;
      
      while (retries > 0 && !blob) {
        try {
          // iOS Safari blank image workaround: call it once before the final call to force rendering 
          await toBlob(cardRef.current, { pixelRatio: 0.5, cacheBust: true });
          await new Promise(resolve => setTimeout(resolve, 100));

          blob = await toBlob(cardRef.current, {
            quality: 1.0,
            pixelRatio: 3, // High quality for crisp rendering
            cacheBust: true
          });
          if (blob) break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          // Wait briefly, allowing browser to retry canvas paint
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], `powerplay_club_${club.id}.png`, { type: "image/png" });
      
      const downloadFallback = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: t("club.card.shareTitle", { fallback: "우리 동호회를 소개합니다!" }),
            text: t("club.card.shareText", { fallback: "파워플레이에서 우리 동호회를 확인해보세요." }),
          });
        } catch (shareErr) {
          if (shareErr instanceof Error) {
            if (shareErr.name === 'AbortError') {
              console.log("User cancelled share");
              return;
            }
            if (shareErr.name === 'NotAllowedError') {
              console.log("Share not allowed, falling back to download");
              downloadFallback();
              return;
            }
          }
          throw shareErr;
        }
      } else {
        downloadFallback();
      }
    } catch (err) {
      console.error("Error sharing card:", err);
      alert(t("common.error", { fallback: "오류가 발생했습니다." }));
    } finally {
      setSharing(false);
    }
  };

  // Format dates and details
  const establishedDate = club.created_at ? new Date(club.created_at).getFullYear().toString() : new Date().getFullYear().toString();
  
  // Calculate if we need to conserve vertical space based on rinks count
  const rinksCount = club.rinks?.length || 0;
  const hasManyRinks = rinksCount >= 3;

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-950 z-50 flex flex-col pt-safe px-4 pb-safe-bottom overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4 max-w-[420px] mx-auto w-full">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors flex items-center shrink-0"
        >
          <ChevronLeft className="w-6 h-6 mr-1" />
          <span className="font-semibold">{t("club.card.title", { fallback: "동호회 디지털 카드" })}</span>
        </button>
        
        {/* Ratio Toggle */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
          <button
            onClick={() => setRatio('story')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${ratio === 'story' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {t("club.card.ratioStory", { fallback: "스토리 9:16" })}
          </button>
          <button
            onClick={() => setRatio('post')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${ratio === 'post' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            {t("club.card.ratioPost", { fallback: "게시물 4:5" })}
          </button>
        </div>
      </div>

      {/* Card Container Layout Wrapper (prevents html-to-image margin bleeding) */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 w-full">
        
        <div className={`relative w-full mx-auto transition-all duration-300 ${ratio === 'post' ? 'max-w-[380px] md:max-w-[420px] aspect-[4/5]' : 'max-w-[340px] md:max-w-sm aspect-[5/8]'} max-h-[80vh]`}>
          {/* The Actual Card */}
          <div 
            ref={cardRef}
            className="absolute inset-0 w-full h-full rounded-[24px] p-5 flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all"
            style={{
              background: "linear-gradient(145deg, #18181b 0%, #09090b 100%)", // sleek dark zinc
            }}
          >
            {/* Background accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex justify-between items-start z-10 w-full mb-3 text-white shrink-0">
            {/* POWERPLAY Branding top-left */}
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/10">
              <span className="font-black text-[8px] md:text-[9px] tracking-widest text-blue-400">POWERPLAY</span>
            </div>
          </div>

          {/* Main Visual Section */}
          <div className={`relative w-full z-10 flex transition-all duration-300 drop-shadow-2xl ${
            showFullDesc 
              ? "flex-row items-center justify-start gap-3 mt-0 mb-3 h-12 shrink-0" 
              : ratio === 'post'
                ? "flex-row items-center justify-start gap-4 my-2 min-h-0"
                : "flex-1 flex-col justify-center items-center my-1 min-h-0"
          }`}>
              <div className={`${
                showFullDesc 
                  ? "w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl mb-0 shrink-0" 
                  : ratio === 'post'
                    ? "w-16 h-16 md:w-20 md:h-20 min-h-[64px] rounded-2xl mb-0 shrink-0"
                    : (hasManyRinks ? "w-20 h-20 md:w-24 md:h-24 min-h-[80px] rounded-3xl mb-2 shrink-0" : "w-28 h-28 md:w-32 md:h-32 min-h-[112px] rounded-3xl mb-3 shrink-0")
              } bg-zinc-800/80 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl transition-all duration-300`}>
                {club.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img crossOrigin={logoDataUrl ? undefined : "anonymous"} src={logoDataUrl || club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`${showFullDesc ? "text-lg" : ratio === 'post' ? "text-2xl" : "text-4xl"} font-black text-white p-2 transition-all`}>
                    {club.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div 
                className={`w-full min-w-0 flex-1 px-1 flex flex-col justify-center ${showFullDesc || ratio === 'post' ? "items-start" : "items-center"}`}
                style={{ containerType: "inline-size" }}
              >
                <h2 
                  className="font-black text-white tracking-tighter whitespace-nowrap transition-all"
                  style={{
                    fontSize: showFullDesc
                      ? `min(1.25rem, 100cqi / ${Math.max(club.name.length * 1.1, 1)})`
                      : ratio === 'post'
                        ? `min(1.8rem, 100cqi / ${Math.max(club.name.length * 0.9, 1)})`
                        : `min(${hasManyRinks ? "1.75" : "2"}rem, 100cqi / ${Math.max(club.name.length * 1.1, 1)})`
                  }}
                >
                  {club.name}
                </h2>
              </div>
          </div>

          {/* Details Sections - two separate cards */}
          <div className="z-10 w-full flex flex-col gap-2.5 mt-auto">
            {club.description && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all w-full flex-shrink-0 flex flex-col">
                <div className="text-[10px] text-zinc-400 mb-2 uppercase tracking-wider flex justify-between items-center">
                  <span className="whitespace-nowrap">About Us</span>
                  {(descPages.length > 1 || (club.description && club.description.length > 50) || (club.description && club.description.split('\n').length > 2)) && (
                    <button 
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-medium px-1 cursor-pointer select-none whitespace-nowrap shrink-0"
                    >
                      {showFullDesc ? t("common.fold", { fallback: "접기" }) : t("common.more", { fallback: "전체 보기" })}
                    </button>
                  )}
                </div>
                
                {!showFullDesc ? (
                  <div className={`text-sm font-medium text-white/90 leading-relaxed whitespace-pre-wrap transition-all ${ratio === 'post' ? 'line-clamp-1' : 'line-clamp-2'}`}>
                    {club.description}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className={`text-sm font-medium text-white/90 leading-relaxed whitespace-pre-wrap transition-all ${descPages.length > 1 ? (ratio === 'post' ? "h-[65px]" : "h-[155px]") : "h-auto"}`}>
                      {descPages[descPage]}
                    </div>
                    
                    {descPages.length > 1 && (
                      <div className="flex items-center justify-center mt-1 relative w-full h-6 shrink-0">
                        <button 
                          onClick={() => setDescPage(Math.max(0, descPage - 1))}
                          disabled={descPage === 0}
                          className="text-white/50 disabled:opacity-30 hover:text-white transition-opacity absolute left-0 p-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex gap-1.5 flex-wrap justify-center max-w-[150px]">
                          {descPages.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === descPage ? 'bg-blue-400' : 'bg-white/20'}`} />
                          ))}
                        </div>
                        
                        <button 
                          onClick={() => setDescPage(Math.min(descPages.length - 1, descPage + 1))}
                          disabled={descPage === descPages.length - 1}
                          className="text-white/50 disabled:opacity-30 hover:text-white transition-opacity absolute right-0 p-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {club.rinks && club.rinks.length > 0 && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all w-full shrink-0">
                <div className="text-[10px] text-zinc-400 mb-2 uppercase tracking-wider">Home Rinks</div>
                <div className="flex flex-col gap-2">
                  {club.rinks.slice(0, 3).map(rink => {
                    const region = extractRegion(rink.address);
                    let displayName = rink.name_ko;
                    let rText = `${displayName}${region ? ` (${region})` : ""}`;
                    
                    return (
                      <div 
                        key={rink.id} 
                        className="text-white bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5 overflow-hidden w-full"
                        style={{ containerType: "inline-size" }}
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span 
                          className="font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            fontSize: `min(0.85rem, 105cqi / ${Math.max(rText.length * 0.95, 1)})`
                          }}
                        >
                          {displayName} {region && <span className="text-white/60 font-medium">({region})</span>}
                        </span>
                      </div>
                    );
                  })}
                  {club.rinks.length > 3 && (
                    <div className="text-[10px] font-bold text-center text-white/40 pt-1">
                      +{club.rinks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Share Button Placeholder outside card */}
        <div className={`w-full ${ratio === 'post' ? 'max-w-[380px] md:max-w-[420px]' : 'max-w-sm'} mt-8 transition-all`}>
          <button
            onClick={handleShare}
            disabled={sharing || (Boolean(club.logo_url) && !logoDataUrl)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg shadow-lg disabled:opacity-70 transition-transform active:scale-95"
            style={{
              background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)", // Blue share button matches premium theme (like Player Card)
            }}
          >
            {sharing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                {t("club.card.share", { fallback: "공유하기" })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
