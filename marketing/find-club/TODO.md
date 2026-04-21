# 📋 "나에게 맞는 하키클럽 찾기" — 개선 작업 TODO

> 전략: A(입문자) ↔ B(동호회) ↔ C(성인 비즈니스) 플랫폼 효과 연결
> 기능명: "나에게 맞는 하키클럽 찾기"

---

## 🔧 코드 수정 (Phase 1)

### 1. 지역 매칭 로직 강화 (`src/app/actions/find-club.ts`, `src/lib/rink-utils.ts`)
- [x] `extractRegion` — trim, 다중 공백 정규화
- [x] `scoreClub` 지역 매칭: `includes` → **strict equality** (`userRegions.includes(clubRegion)`)
- [x] `scoredBusinesses` 배열에도 `.filter(c => c.score > 0)` 추가
- [x] 매치 없어도 동호회(B)가 등록만 되어 있으면 club_rinks를 통해 노출되는지 확인 — **현재도 노출됨** (지역 매칭 성공하면 score 100+). 추가 조치 없음.

### 2. "4가지" → "3가지" 문구 통일 + q3 cleanup
- [x] `messages/ko.json`, `messages/en.json`: `findClub.q3` 블록 제거
- [x] `findClub.subtitle`, `findClub.meta.description`, `findClub.cta.description` → "3가지"
- [x] `src/components/find-club-banner.tsx` → "3가지 질문"
- [x] `src/app/[locale]/(public)/find-club/page.tsx` → "3가지 질문"

### 3. "전체 지역" 버튼 제거
- [x] `src/components/find-club-wizard.tsx` — RegionGrid "전체" 버튼 삭제
- [x] step 2 `canProceed`에 `selectedRegions.length > 0` 조건 추가

### 4. 배너 위치 (요청 #1)
- [x] 이미 요청대로 배치됨 (홈/링크장/동호회 페이지 모두 tabs 하위) — 변경 불필요

---

## ✅ 검증 (Phase 2)
- [x] `npm run typecheck`
- [x] `npm run lint` (touched 파일만)

---

## 🎨 카드뉴스 대본 (Phase 3)
- [x] `marketing/find-club/cardnews-script.md` 작성
- [x] 구성: 훅 → 아이스하키 매력 → 입문 고민 → 파워플레이 특장점(3번째 장쯤) → 기능 소개 → CTA

---

## 📌 평가 요약

### 잘 된 점
- Wizard UX (진행 바, 애니메이션, 공유/재시작)
- 플랫폼 효과 설계 (클럽 정보 많을수록 점수 ↑)
- 유소년 시 lounge_business(C) 자동 merge
- 3곳 진입점 (홈/링크장/동호회) 배너

### 기존 이슈 (수정 완료)
- 유소년 lounge_businesses 필터 누락 → score 음수도 노출되던 버그
- 지역 매칭 `includes` 기반 느슨함 → strict로 전환
- "4가지 질문" 문구 vs 실제 3단계
- 잔존 q3 번역
- "전체 지역" 버튼이 존재
