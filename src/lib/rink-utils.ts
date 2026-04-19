import { Rink } from "@/app/actions/types";

const PROVINCE_MAP: Record<string, string> = {
  "서울특별시": "서울",
  "경기도": "경기",
  "인천광역시": "인천",
  "부산광역시": "부산",
  "대전광역시": "대전",
  "대구광역시": "대구",
  "광주광역시": "광주",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "세종시": "세종",
  "충청남도": "충남",
  "충청북도": "충북",
  "강원특별자치도": "강원",
  "강원도": "강원",
  "전라남도": "전남",
  "전라북도": "전북",
  "전북특별자치도": "전북",
  "경상남도": "경남",
  "경상북도": "경북",
  "제주특별자치도": "제주",
  "제주도": "제주",
};

/**
 * Extract region (시도 + 시군구) from a Korean address string.
 * e.g. "서울특별시 성북구 안암로 145" → "서울 성북구"
 */
export function extractRegion(address?: string): string {
  if (!address) return "";
  const parts = address.split(" ");
  if (parts.length >= 1) {
    let province = parts[0];
    if (PROVINCE_MAP[province]) {
      province = PROVINCE_MAP[province];
    }
    if (parts.length >= 2) {
      return `${province} ${parts[1]}`;
    }
    return province;
  }
  return "";
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
