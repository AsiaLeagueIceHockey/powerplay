/**
 * Supabase Storage 이미지 일괄 재압축 스크립트
 *
 * 목적:
 * - 기존에 업로드된 club-logos 버킷의 모든 이미지를 sharp로 재압축한다.
 * - 파일 경로(URL)는 보존하므로 DB 변경이 필요 없다.
 * - WebP로 변환하지 않고 원본 포맷(jpg/png/webp)을 유지해 호환성 안전.
 *
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 실행 방법:
 *   npx tsx scripts/recompress-storage-images.ts            # dry-run (기본)
 *   npx tsx scripts/recompress-storage-images.ts --apply    # 실제 덮어쓰기
 *
 * kind 자동 판정:
 *   - 경로가 'lounge/'로 시작 + 짧은 변 ≥ 400px → cover (1280x720, q75)
 *   - 그 외(혹은 작은 사이즈)                  → logo  (256x256, q80)
 *
 * 안전장치:
 *   - 압축 후 크기가 원본보다 크면 스킵
 *   - 메타데이터를 읽지 못한(이미 깨졌거나 비이미지) 파일은 스킵
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { recompressInPlace, type ImageKind } from "../src/lib/image-utils";

// Next.js와 동일한 방식으로 .env.local 등을 로드한다.
// (tsx 단독 실행 시 process.env에 자동 주입되지 않으므로 필수)
loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "club-logos";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type StoredFile = {
  path: string;
  size: number;
};

async function listAllFiles(prefix = "", acc: StoredFile[] = []): Promise<StoredFile[]> {
  // Supabase Storage list는 폴더 단위로 동작. 재귀로 모든 파일 수집.
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    console.error(`list failed @${prefix || "/"}:`, error.message);
    return acc;
  }
  if (!data) return acc;

  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null && item.metadata === null) {
      // 폴더인 경우 (Supabase는 placeholder를 함께 반환함)
      await listAllFiles(fullPath, acc);
    } else if (item.metadata) {
      acc.push({
        path: fullPath,
        size: typeof item.metadata.size === "number" ? item.metadata.size : 0,
      });
    }
  }
  return acc;
}

function detectFormat(path: string): "jpeg" | "png" | "webp" | null {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";
  return null;
}

async function processOne(file: StoredFile) {
  const format = detectFormat(file.path);
  if (!format) {
    return { status: "skip", reason: `unsupported ext: ${file.path}` };
  }

  // 다운로드
  const { data: blob, error: dlError } = await supabase.storage
    .from(BUCKET)
    .download(file.path);
  if (dlError || !blob) {
    return { status: "error", reason: `download: ${dlError?.message || "no data"}` };
  }
  const original = Buffer.from(await blob.arrayBuffer());

  // 메타데이터로 kind 판정
  let meta;
  try {
    meta = await sharp(original).metadata();
  } catch (e) {
    return { status: "skip", reason: `metadata read failed: ${(e as Error).message}` };
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const shorter = Math.min(w, h);

  const isLoungeFolder = file.path.startsWith("lounge/");
  const kind: ImageKind = isLoungeFolder && shorter >= 400 ? "cover" : "logo";

  // 재압축
  let compressed: Buffer;
  try {
    compressed = await recompressInPlace(original, kind, format);
  } catch (e) {
    return { status: "error", reason: `compress: ${(e as Error).message}` };
  }

  if (compressed.length >= original.length) {
    return {
      status: "skip",
      reason: `already small (${original.length} → ${compressed.length})`,
    };
  }

  if (!APPLY) {
    return {
      status: "dry",
      reason: `${kind} ${w}x${h} ${original.length}B → ${compressed.length}B (-${Math.round((1 - compressed.length / original.length) * 100)}%)`,
    };
  }

  // upsert (덮어쓰기)
  const contentType =
    format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
  const { error: upError } = await supabase.storage.from(BUCKET).upload(file.path, compressed, {
    cacheControl: "31536000",
    upsert: true,
    contentType,
  });
  if (upError) {
    return { status: "error", reason: `upload: ${upError.message}` };
  }

  return {
    status: "ok",
    reason: `${kind} ${w}x${h} ${original.length}B → ${compressed.length}B (-${Math.round((1 - compressed.length / original.length) * 100)}%)`,
  };
}

(async () => {
  console.log(`mode: ${APPLY ? "APPLY (writes will happen!)" : "dry-run"}`);
  console.log(`bucket: ${BUCKET}`);
  console.log("listing all files...");

  const files = await listAllFiles();
  console.log(`found ${files.length} files`);

  let okCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let savedBytes = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const r = await processOne(f);
    const tag =
      r.status === "ok" ? "✓" : r.status === "dry" ? "·" : r.status === "skip" ? "—" : "✗";
    console.log(`[${i + 1}/${files.length}] ${tag} ${f.path} → ${r.reason}`);

    if (r.status === "ok" || r.status === "dry") {
      okCount++;
      const match = r.reason.match(/(\d+)B → (\d+)B/);
      if (match) savedBytes += parseInt(match[1], 10) - parseInt(match[2], 10);
    } else if (r.status === "skip") {
      skipCount++;
    } else {
      errorCount++;
    }
  }

  console.log("\n=== summary ===");
  console.log(`processed: ${okCount}, skipped: ${skipCount}, errors: ${errorCount}`);
  console.log(`would save: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
  if (!APPLY) {
    console.log("\n(dry-run only. re-run with --apply to actually overwrite.)");
  }
})();
