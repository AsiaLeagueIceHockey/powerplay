# 동호회 미등록 안내 - 경기 생성 페이지

## Goal
관리자가 동호회를 아직 등록하지 않은 경우에도, 경기 생성 폼(새 경기 생성 / 한달치 생성)에서:
1. "동호회 없음 (개인 주최)"가 항상 표시되도록 한다
2. 동호회 미등록 시 안내 배너를 표시하여 동호회 등록을 유도한다

## TODO

### Phase 1: UI 변경
- [x] `match-form.tsx` — 동호회 없을 때도 "동호회 없음 (개인 주최)" 표시
- [x] `match-form.tsx` — 동호회 미등록 안내 배너 추가 (CTA: 동호회 페이지 이동)
- [x] `bulk-match-form.tsx` — 동호회 없을 때도 "동호회 없음 (개인 주최)" 표시
- [x] `bulk-match-form.tsx` — 동호회 미등록 안내 배너 추가 (CTA: 동호회 페이지 이동)

### Phase 2: i18n
- [x] `messages/ko.json` — 안내 메시지 키 추가
- [x] `messages/en.json` — 안내 메시지 키 추가

### Phase 3: Verification
- [x] `npm run build` passes
