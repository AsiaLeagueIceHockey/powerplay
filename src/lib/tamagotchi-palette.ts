import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

export type TamagotchiPart = "helmet" | "jersey" | "skate";

export interface TamagotchiPaletteEntry {
  /** i18n key under `mypage.tamagotchi.closet.colors.*` */
  key: string;
  /** Hex color (uppercase, 7 chars including `#`) — must match DB whitelist exactly */
  hex: string;
}

/**
 * 다마고치 옷장 팔레트 — DB `update_tamagotchi_colors` RPC 의 화이트리스트와 정확히 동일.
 * 변경 시 `sql/v55_tamagotchi_colors.sql` 의 v_*_allowed 배열도 함께 업데이트.
 */
export const TAMAGOTCHI_PALETTE: Record<TamagotchiPart, readonly TamagotchiPaletteEntry[]> = {
  helmet: [
    { key: "white", hex: "#FFFFFF" },
    { key: "black", hex: "#1F2937" },
    { key: "red", hex: "#DC2626" },
    { key: "blue", hex: "#2563EB" },
    { key: "navy", hex: "#1E3A8A" },
    { key: "gold", hex: "#F59E0B" },
    { key: "silver", hex: "#9CA3AF" },
  ],
  jersey: [
    { key: "blue", hex: "#2563EB" },
    { key: "red", hex: "#DC2626" },
    { key: "black", hex: "#1F2937" },
    { key: "green", hex: "#16A34A" },
    { key: "orange", hex: "#EA580C" },
    { key: "purple", hex: "#9333EA" },
    { key: "navy", hex: "#1E3A8A" },
    { key: "white", hex: "#FFFFFF" },
  ],
  skate: [
    { key: "white", hex: "#FFFFFF" },
    { key: "black", hex: "#1F2937" },
    { key: "red", hex: "#DC2626" },
    { key: "yellow", hex: "#FACC15" },
    { key: "neonGreen", hex: "#22C55E" },
  ],
} as const;

export const TAMAGOTCHI_DEFAULT_COLORS: TamagotchiPetColors = {
  helmet: "#FFFFFF",
  jersey: "#2563EB",
  skate: "#FFFFFF",
} as const;

export const TAMAGOTCHI_PARTS: readonly TamagotchiPart[] = ["helmet", "jersey", "skate"] as const;

/** 화이트리스트 검사 — 클라이언트 측 가드 (실제 권한은 RPC 가 강제). */
export function isAllowedColor(part: TamagotchiPart, hex: string): boolean {
  const upper = hex.toUpperCase();
  return TAMAGOTCHI_PALETTE[part].some((entry) => entry.hex.toUpperCase() === upper);
}

/** 입력 hex 가 화이트리스트에 없으면 default 로 폴백. DB 에서 받은 값을 안전하게 표시할 때 사용. */
export function normalizeColors(input: Partial<TamagotchiPetColors> | null | undefined): TamagotchiPetColors {
  return {
    helmet:
      input?.helmet && isAllowedColor("helmet", input.helmet) ? input.helmet : TAMAGOTCHI_DEFAULT_COLORS.helmet,
    jersey:
      input?.jersey && isAllowedColor("jersey", input.jersey) ? input.jersey : TAMAGOTCHI_DEFAULT_COLORS.jersey,
    skate:
      input?.skate && isAllowedColor("skate", input.skate) ? input.skate : TAMAGOTCHI_DEFAULT_COLORS.skate,
  };
}
