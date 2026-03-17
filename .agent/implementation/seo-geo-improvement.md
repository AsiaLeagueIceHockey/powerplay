# Feature Title: SEO & GEO 종합 개선

## Goal
검색엔진(Google, Naver)과 AI 검색(GEO)에서 PowerPlay 페이지가 잘 검색되도록 종합 SEO 개선

## TODO

### Phase 1: Dynamic Sitemap & robots.txt
- [x] `src/app/sitemap.ts` - 동적 sitemap (clubs, matches 포함)
- [x] `src/app/robots.ts` - 비공개 경로 차단 강화

### Phase 2: Per-Page Metadata
- [x] `clubs/[id]/page.tsx` - generateMetadata
- [x] `match/[id]/page.tsx` - generateMetadata
- [x] `about/page.tsx` - generateMetadata
- [x] `terms/page.tsx` - generateMetadata
- [x] `(public)/page.tsx` - generateMetadata (home, alternates)

### Phase 3: JSON-LD Structured Data
- [x] `src/components/json-ld.tsx` - 재사용 JSON-LD 컴포넌트
- [x] `[locale]/layout.tsx` - WebSite + Organization JSON-LD
- [x] `clubs/[id]/page.tsx` - SportsTeam JSON-LD
- [x] `match/[id]/page.tsx` - SportsEvent JSON-LD

### Phase 4: Verification
- [x] `npm run build` 성공

## 2026-03-18 Indexing Strategy Update

- `clubs/[id]` 상세는 public Supabase fetch + `revalidate = 900` 기반 ISR로 전환
- `src/lib/public-clubs.ts` 추가: club ids / club detail / notices public cache helper
- `/[locale]/clubs` 디렉토리 페이지 추가: 검색엔진용 허브 페이지 역할
- 홈 화면에는 동호회 허브 섹션을 노출하지 않음. 기존 탭 UX 유지
- 대신 경기 카드 하단 동호회 배지, 경기 상세 상단/주최팀 영역에서 동호회 상세로 직접 이동 가능하게 내부 링크 강화
- `sitemap.xml` 은 경기 URL을 `open + future` 만 제출하도록 축소
- `match/[id]` 는 past/closed/canceled 페이지를 `robots.index = false` 처리
- 클럽 생성/수정/공지/가입/탈퇴 후 `revalidateTag("clubs")` 로 클럽 상세/디렉토리 캐시 무효화
