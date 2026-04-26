import sharp from "sharp";

/**
 * 업로드된 이미지를 sharp로 리사이즈 + WebP 인코딩한다.
 *
 * 목적:
 * - Vercel Image Optimization 비활성화(`images.unoptimized: true`) 환경에서
 *   업로드 단계에서 한 번만 압축해 Supabase Storage egress와 클라이언트 다운로드를 모두 줄인다.
 * - 결과 파일은 항상 WebP. 호출부에서 파일명 확장자도 `.webp`로 맞춘다.
 *
 * 일반 사진(2~5MB) 기준 결과:
 *   - logo  (256x256, q80) → 5~20KB
 *   - cover (1280x720, q75) → 80~200KB
 */
export type ImageKind = "logo" | "cover";

const PRESETS: Record<ImageKind, { width: number; height: number; quality: number }> = {
  // 표시 위치 최대 크기(96x96) × 2배 DPR + 여유
  logo: { width: 256, height: 256, quality: 80 },
  // 라운지 비즈니스 커버. 모바일 풀폭 + 데스크톱 카드용
  cover: { width: 1280, height: 720, quality: 75 },
};

export async function compressImageToWebp(
  buffer: Buffer,
  kind: ImageKind
): Promise<Buffer> {
  const { width, height, quality } = PRESETS[kind];

  return sharp(buffer)
    .rotate() // EXIF 회전 정보 적용
    .resize(width, height, {
      fit: kind === "logo" ? "cover" : "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

/**
 * 마이그레이션·재압축용. 포맷을 유지하면서 사이즈와 품질만 낮춘다.
 * (기존 URL의 확장자를 보존해 DB 변경 없이 덮어쓰기 가능)
 */
export async function recompressInPlace(
  buffer: Buffer,
  kind: ImageKind,
  format: "jpeg" | "png" | "webp"
): Promise<Buffer> {
  const { width, height, quality } = PRESETS[kind];
  const pipeline = sharp(buffer).rotate().resize(width, height, {
    fit: kind === "logo" ? "cover" : "inside",
    withoutEnlargement: true,
  });

  if (format === "jpeg") return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  if (format === "png") return pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
  return pipeline.webp({ quality }).toBuffer();
}
