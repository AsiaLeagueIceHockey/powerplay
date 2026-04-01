# 📅 한달치 경기 일괄 생성

## Goal
관리자가 한 달치 반복 경기를 한 번에 생성할 수 있는 기능. 이전달 데이터 복사 → 날짜 조정 → 일괄 등록.

## TODO

### Phase 1: 유틸리티 & 서버 액션
- [x] `src/lib/bulk-match-utils.ts` 생성
- [x] `tests/unit/bulk-match-utils.test.ts` 생성 (24 tests)
- [x] 유틸리티 테스트 통과 확인
- [x] `src/app/actions/admin.ts`에 `createBulkMatches` 서버 액션 추가
- [x] `src/app/actions/admin.ts`에 `getPreviousMonthMatches` 서버 액션 추가

### Phase 2: UI 컴포넌트
- [x] `src/components/schedule-pattern-card.tsx` 생성
- [x] `src/components/bulk-match-form.tsx` 생성

### Phase 3: 페이지 & 연결
- [x] `src/app/[locale]/(admin)/admin/matches/bulk/page.tsx` 생성
- [x] `src/app/[locale]/(admin)/admin/matches/page.tsx` 수정 — 📅 한달치 생성 버튼 추가
- [x] `messages/ko.json` i18n 키 추가 (`admin.bulk.*`)
- [x] `messages/en.json` i18n 키 추가 (`admin.bulk.*`)

### Phase 4: 검증
- [x] `npm run build` 에러 없이 통과
- [x] 유닛 테스트 24개 통과
- [ ] 수동 테스트 및 UI 확인 (사용자 진행)
