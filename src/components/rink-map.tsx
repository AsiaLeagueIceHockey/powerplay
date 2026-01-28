"use client";

import { useState } from "react";
import { NaverMap, Marker, useNavermaps, Container as MapContainer, NavermapsProvider } from "react-naver-maps";
import { Rink } from "../app/actions/types";
import { Match } from "../app/actions/match";
import { Navigation, Calendar, MapPin, X } from "lucide-react";
import Link from "next/link";

interface RinkMapProps {
  rinks: Rink[];
  matches?: Match[];
}

function RinkDetailCard({ rink, matches, onClose }: { rink: Rink; matches: Match[]; onClose: () => void }) {
  const rinkMatches = matches
    .filter((m) => m.rink?.id === rink.id)
    .filter((m) => new Date(m.start_time) >= new Date()) // Future matches only
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3); // Top 3

  return (
    <div className="absolute bottom-4 left-4 right-4 p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-lg z-20 md:bottom-auto md:left-4 md:top-4 md:right-auto md:w-80 animate-in slide-in-from-bottom-10 md:slide-in-from-left-2 fade-in duration-300 border border-zinc-200 dark:border-zinc-800 max-h-[40%] overflow-y-auto">
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="pr-8">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{rink.name_ko}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
          {rink.address || "주소 정보 없음"}
        </p>

        {rinkMatches.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              예정된 경기
            </h4>
            <ul className="space-y-2">
              {rinkMatches.map((match) => (
                <li key={match.id}>
                  <Link href={`/match/${match.id}`} className="block text-sm bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                     <div className="font-medium text-zinc-800 dark:text-zinc-200">
                      {new Intl.DateTimeFormat("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(match.start_time))}
                     </div>
                     <div className="text-xs text-zinc-500 flex justify-between mt-1">
                       <span>{match.description || "친선 경기"}</span>
                       <span className={match.status === "open" ? "text-blue-600 font-medium" : "text-zinc-400"}>
                          {match.status === "open" ? "신청 가능" : "마감"}
                       </span>
                     </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
            <a 
                href={rink.map_url || `https://map.naver.com/v5/search/${rink.name_ko}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#03C75A] hover:bg-[#02b351] text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
            >
                <span className="font-black">N</span> 네이버 지도
            </a>
            {/* Future: Add 'View All Matches' button here */}
        </div>
      </div>
    </div>
  );
}

function RinkMapContent({ rinks, matches = [] }: RinkMapProps) {
  const navermaps = useNavermaps();
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRink, setSelectedRink] = useState<Rink | null>(null);

  // Determine initial center
  // If single rink (Detail View), center on it.
  // If multiple rinks (Explorer View), default to Seoul (will update with Geolocation).
  const initialCenter = rinks.length === 1 && rinks[0].lat && rinks[0].lng
    ? new navermaps.LatLng(rinks[0].lat, rinks[0].lng)
    : new navermaps.LatLng(37.5665, 126.9780);

  const handleMyLocation = () => {
    if (!map) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newCenter = new navermaps.LatLng(lat, lng);
          setMyLocation({ lat, lng });
          map.setCenter(newCenter);
          map.setZoom(13); // Zoom in closer for user location
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Optional: Don't alert on auto-load error to avoid annoyance, only on manual click
        }
      );
    }
  };

  // Auto-Geolocation on mount (only for Explorer View)
  useState(() => {
     // Check if we are in Explorer mode (>1 rink)
     if (rinks.length > 1) {
        // We use a small timeout to ensure map is ready or just rely on 'map' state effect?
        // Actually, we can use an effect dependent on 'map'.
     }
  });

  // Effect to trigger geolocation once map is loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [autoLocateDone, setAutoLocateDone] = useState(false);
  
  if (map && !autoLocateDone && rinks.length > 1) {
    handleMyLocation();
    setAutoLocateDone(true);
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
      <MapContainer className="w-full h-full">
        <NaverMap
            defaultCenter={initialCenter}
            defaultZoom={rinks.length === 1 ? 15 : 11}
            ref={setMap}
            draggable={true}
            pinchZoom={true}
            scrollWheel={true}
            keyboardShortcuts={true}
            scaleControl={true}
            mapDataControl={false}
            logoControl={false} // Custom positioning if needed, or let it be
        > 
            {/* Rink Markers */}
            {rinks.map((rink) => (
          rink.lat && rink.lng ? (
            <Marker
              key={rink.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              position={new navermaps.LatLng(rink.lat, rink.lng) as any}
              onClick={() => setSelectedRink(rink)}
              icon={{
                content: `
                  <div class="px-2 py-1 bg-white border border-zinc-300 rounded shadow-md text-xs font-bold whitespace-nowrap dark:bg-zinc-800 dark:border-zinc-600 dark:text-white hover:scale-110 transition-transform cursor-pointer ${selectedRink?.id === rink.id ? 'border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' : ''}">
                    ${rink.name_ko}
                  </div>
                `,
                anchor: new navermaps.Point(10, 30),
              }}
            />
          ) : null
        ))}

        {/* My Location Marker */}
        {myLocation && (
          <Marker
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            position={new navermaps.LatLng(myLocation.lat, myLocation.lng) as any}
            icon={{
                content: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation"></div>`,
                anchor: new navermaps.Point(8, 8),
            }}
          />
        )}
        </NaverMap>
      </MapContainer>

      {/* Rink Detail Card Overlay */}
      {selectedRink && (
        <RinkDetailCard 
            rink={selectedRink} 
            matches={matches} 
            onClose={() => setSelectedRink(null)} 
        />
      )}

      {/* Floating My Location Button */}
      <button
        onClick={handleMyLocation}
        className="absolute bottom-6 right-6 bg-white dark:bg-zinc-800 p-3 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 z-10 transition-transform active:scale-95 text-zinc-700 dark:text-zinc-200"
        title="내 위치"
      >
        <Navigation className="w-5 h-5" />
      </button>
    </div>
  );
}

export function RinkMap({ rinks, matches }: RinkMapProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return <div className="p-4 bg-red-50 text-red-500 rounded">Naver Map Client ID not found.</div>;
  }

  return (
    <NavermapsProvider ncpKeyId={clientId}>
      <RinkMapContent rinks={rinks} matches={matches} />
    </NavermapsProvider>
  );
}
