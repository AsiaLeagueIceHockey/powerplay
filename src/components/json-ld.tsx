/**
 * JSON-LD Structured Data Components for SEO & GEO
 * 
 * These components inject Schema.org structured data into pages,
 * enabling better understanding by search engines and AI models.
 */

const SITE_URL = "https://powerplay.kr";

// Generic JSON-LD script injector
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * WebSite + Organization structured data
 * Place in root layout for sitewide coverage
 */
export function WebSiteJsonLd({ locale }: { locale: string }) {
  const isKo = locale === "ko";
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: "PowerPlay",
            alternateName: "파워플레이",
            description: isKo
              ? "아이스하키 경기 일정 확인, 게스트 참가, 동호회 찾기, 링크장 정보까지. 한국 아이스하키 커뮤니티 플랫폼."
              : "Find ice hockey games, join as a guest player, discover clubs, and explore rinks. The all-in-one platform for Korea's hockey community.",
            inLanguage: isKo ? "ko-KR" : "en-US",
          },
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "PowerPlay",
            alternateName: "파워플레이",
            url: SITE_URL,
            logo: `${SITE_URL}/favicon.png`,
            description: isKo
              ? "아이스하키 경기 일정 확인, 게스트 참가, 동호회 찾기, 링크장 정보까지. 한국 아이스하키 커뮤니티 플랫폼."
              : "Find ice hockey games, join as a guest player, discover clubs, and explore rinks. The all-in-one platform for Korea's hockey community.",
            sameAs: [],
          },
        ],
      }}
    />
  );
}

/**
 * SportsTeam structured data for club detail pages
 */
export function SportsTeamJsonLd({
  club,
  locale,
}: {
  club: {
    id: string;
    name: string;
    description?: string | null;
    logo_url?: string | null;
    member_count?: number;
    rinks?: { name_ko: string; name_en: string; address?: string }[];
  };
  locale: string;
}) {
  const isKo = locale === "ko";
  const url = `${SITE_URL}/${locale}/clubs/${club.id}`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        "@id": url,
        name: club.name,
        url,
        sport: "Ice Hockey",
        description: club.description || (isKo ? "아이스하키 동호회" : "Ice hockey club"),
        ...(club.logo_url && { logo: club.logo_url }),
        ...(club.member_count && {
          member: {
            "@type": "QuantitativeValue",
            value: club.member_count,
          },
        }),
        ...(club.rinks && club.rinks.length > 0 && {
          location: club.rinks.map((rink) => ({
            "@type": "Place",
            name: isKo ? rink.name_ko : rink.name_en,
            ...(rink.address && {
              address: {
                "@type": "PostalAddress",
                streetAddress: rink.address,
                addressCountry: "KR",
              },
            }),
          })),
        }),
        memberOf: {
          "@type": "SportsOrganization",
          name: "PowerPlay",
          url: SITE_URL,
        },
      }}
    />
  );
}

/**
 * SportsEvent structured data for match detail pages
 */
export function SportsEventJsonLd({
  match,
  locale,
}: {
  match: {
    id: string;
    start_time: string;
    duration_minutes?: number | null;
    fee: number;
    entry_points: number;
    status: string;
    match_type: string;
    rink?: { name_ko: string; name_en: string; address?: string; lat?: number; lng?: number } | null;
    club?: { name: string } | null;
  };
  locale: string;
}) {
  const isKo = locale === "ko";
  const url = `${SITE_URL}/${locale}/match/${match.id}`;
  const rinkName = match.rink
    ? (isKo ? match.rink.name_ko : match.rink.name_en || match.rink.name_ko)
    : (isKo ? "아이스링크" : "Ice Rink");

  const startDate = new Date(match.start_time);
  const endDate = match.duration_minutes
    ? new Date(startDate.getTime() + match.duration_minutes * 60 * 1000)
    : undefined;

  const matchTypeName = match.match_type === "game"
    ? (isKo ? "아이스하키 경기" : "Ice Hockey Game")
    : match.match_type === "team_match"
    ? (isKo ? "팀 매치" : "Team Match")
    : (isKo ? "아이스하키 훈련" : "Ice Hockey Training");

  const eventStatus = match.status === "open"
    ? "https://schema.org/EventScheduled"
    : match.status === "closed"
    ? "https://schema.org/EventMovedOnline"  // No perfect mapping, using closest
    : "https://schema.org/EventCancelled";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "@id": url,
        name: `${matchTypeName} - ${rinkName}`,
        url,
        startDate: startDate.toISOString(),
        ...(endDate && { endDate: endDate.toISOString() }),
        eventStatus,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        sport: "Ice Hockey",
        ...(match.rink && {
          location: {
            "@type": "Place",
            name: rinkName,
            ...(match.rink.address && {
              address: {
                "@type": "PostalAddress",
                streetAddress: match.rink.address,
                addressCountry: "KR",
              },
            }),
            ...(match.rink.lat && match.rink.lng && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: match.rink.lat,
                longitude: match.rink.lng,
              },
            }),
          },
        }),
        organizer: match.club
          ? {
              "@type": "SportsTeam",
              name: match.club.name,
            }
          : {
              "@type": "Organization",
              name: "PowerPlay",
              url: SITE_URL,
            },
        offers: {
          "@type": "Offer",
          price: String(match.entry_points || match.fee),
          priceCurrency: "KRW",
          availability: match.status === "open"
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        },
      }}
    />
  );
}

/**
 * Place structured data for rink detail pages
 */
export function RinkPlaceJsonLd({
  rink,
  locale,
}: {
  rink: {
    id: string;
    name_ko: string;
    name_en: string;
    address?: string;
    map_url?: string;
    rink_type?: "FULL" | "MINI";
    lat?: number;
    lng?: number;
    club_count?: number;
    upcoming_match_count?: number;
  };
  locale: string;
}) {
  const isKo = locale === "ko";
  const url = `${SITE_URL}/${locale}/rinks/${rink.id}`;
  const name = isKo ? rink.name_ko : rink.name_en || rink.name_ko;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Place",
        "@id": url,
        name,
        url,
        description: isKo
          ? `${name} 아이스하키 링크장 정보, 예정 경기, 활동 동호회 안내`
          : `${name} rink information, upcoming matches, and club activity details`,
        ...(rink.address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: rink.address,
            addressCountry: "KR",
          },
        }),
        ...(rink.lat && rink.lng && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: rink.lat,
            longitude: rink.lng,
          },
        }),
        ...(rink.map_url && { sameAs: [rink.map_url] }),
        ...(rink.rink_type && {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "rinkType",
            value: rink.rink_type,
          },
        }),
        ...(typeof rink.club_count === "number" && {
          containsPlace: {
            "@type": "SportsActivityLocation",
            sport: "Ice Hockey",
            name,
          },
        }),
        mainEntityOfPage: url,
      }}
    />
  );
}
