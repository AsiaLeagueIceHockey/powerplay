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
