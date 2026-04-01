import { Rink } from "@/app/actions/types";

/**
 * Extract region (시도 + 시군구) from a Korean address string.
 * e.g. "서울특별시 성북구 안암로 145" → "서울특별시 성북구"
 */
export function extractRegion(address?: string): string {
  if (!address) return "";
  const parts = address.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] || "";
}

/**
 * Get unique sorted region strings from a list of rinks.
 */
export function getUniqueRegions(rinks: Rink[]): string[] {
  const regions = new Set<string>();
  for (const rink of rinks) {
    const region = extractRegion(rink.address);
    if (region) {
      regions.add(region);
    }
  }
  return Array.from(regions).sort();
}
