# 디자인 시스템 리스타일 계획 (인계 문서)

- 최종 갱신: 2026-10-22 · 브랜치 `codex/design-system` (원격에 푸시됨, PR은 아직 없음, `main`에 머지 금지)
- 이 문서만으로 다음 세션이 이어서 작업할 수 있게 쓴다. 이전 대화 기록은 필요 없다.
- 함께 읽을 문서:

| 문서 | 내용 |
| --- | --- |
| `docs/design-system.md` | **규칙과 토큰 값의 유일한 기준.** "Rules at a glance" 1~10, "Palette and hierarchy rules" P1~P11, 컴포넌트·레시피 표 |
| `decisions/design-system.md` | 방향 결정 이력 (2026-10-17 → 10-21 → 10-22 개정) |
| `docs/known-issues.md` | 원래부터 실패하는 테스트 7개, 렌더링 중 DB에 쓰는 GET 경로 |
| `docs/lounge-home-banner-spec.md` | 스폰서 배너 이미지 규격 (클럽 전달용) |
| `CLAUDE.md` → "UI 규칙", "검증 안전 규칙" | 진입점과 운영 DB 보호 규칙 |
| `docs/ui-audit.md` | 2026-10-21 최초 감사 (수치는 과거 값) |

- **범위:** 일반 사용자 UI. 관리자(`/admin`), SEO 봇 렌더러(`src/app/seo-bot`), 이미지 내보내기 캔버스(인스타그램, 카드뉴스, 선수·클럽 카드 캔버스, 운세·타마고치 아트워크)는 제외한다. 아트워크 **주변의 일반 컨트롤**은 범위에 들어간다.
- **공통 제약:**
  - 비즈니스 로직, API, 상태 관리, DB 스키마는 바꾸지 않는다.
  - 새 라이브러리는 추가하지 않는다. 필요하면 먼저 묻는다.
  - 문구는 바꾸지 않는다. 바꾸는 편이 낫다면 제안만 한다.
  - `.env.local`은 **운영 Supabase**를 가리킨다. dev 서버 검증은 `CLAUDE.md` "검증 안전 규칙"대로 한다(로그아웃 새 세션, GET/HEAD 외 요청 차단, 로그인 상태로 쓰기 경로 금지).

## 0. 현재 상태

### 완료 (커밋 순서)

| 단계 | 커밋 | 내용 |
| --- | --- | --- |
| 공유 계층 | `dc44f6b`~`d787ac0` | `pp-*` 토큰, 프리미티브와 레시피, 갤러리(`/dev/design-system`, DB 미연결), `ui:check`/`ui:test`/`ui:visual`, 사용자 화면 마이그레이션 |
| ① 토큰 1차 | `1caa308` | radius 8px(모달 12px), 테두리만 있는 카드, 여백 확대, 칩·배지 pill |
| 경계선·로고 | `5d01580` | `--pp-control-border`(입력 경계 3:1 이상), 다크 로고 투명 처리 |
| CSS 레이어 | `5ee7532` | `pp-*` 규칙을 `@layer components`로 이동. 이제 Tailwind 유틸리티가 레시피를 덮어쓴다(레이아웃 용도로만 쓸 것) |
| 회귀 복구 | `77f0505` | 마이그레이션에서 빠진 레이아웃 11곳 복구. `ui:check`는 `density: "none"` Surface의 패딩과 Surface의 `h-full`만 허용 |
| 아이콘 버튼 | `7380726` | `iconButtonStyles()`, 아이콘 전용 버튼 19곳 |
| 팔레트 A + 홈 | `981959a` | 팔레트 A(Slate) + 중립 다크 + P5 + P4-2 토큰, `linkStyles()`, 동호회 카드 A안, 클럽 찾기 = 유일한 primary, 헤더 로그인 secondary, 하단 내비 불투명 |
| 배너 | `6d260c2` | 홈 캐러셀은 스폰서만(커버 이미지 있으면 크게, 없으면 남색) + "광고" 표시. 자체 링크(인스타·오픈채팅)는 목록 끝 조용한 링크. 하단 내비 라운지 금색 반짝임 제거 |
| 검증 스크립트 | `c80c0ef` | `scripts/ui-route-shots.mjs`, `scripts/ui-gallery-diff.mjs` (§1 검증 참고) |

### 결정 사항 요약

- 팔레트 A(Slate)와 P5(섹션 = 하나의 색 계열: PowerPlay 파랑, 라운지 금색, 청소년 보라)를 적용했다. 응원 색은 브랜드 계열을 따른다(P4-2).
- 동호회 카드는 A안(클럽 찾기 중심)이다. 응원 투표는 44px outline 버튼, 1~3위는 본문색 굵게.
- 배너: 유료 = 클럽 이미지(B), 이미지가 없으면 남색(A). 표시 문구는 "광고". 자체 배너는 캐러셀 밖.
- 유료/자체 구분: DB 변경 없이 출처로 구분한다(`feedback-banner.tsx`: 라운지 비즈니스 = `sponsor`, `HouseLinks` = 자체). 나중에 엄밀하게 하려면 `lounge_businesses.home_banner_kind`를 추가하거나, 활성 `lounge_memberships`가 있을 때만 "광고"를 붙인다. **둘 다 DB 변경이라 별도 승인이 필요하다.**
- 하단 내비 금색 반짝임은 제거했다. 조건 없이 항상 돌던 홍보 애니메이션이라 "새 소식 점"으로 바꿀 데이터가 없었다. 새 소식 신호가 생기면 무채색 점(`bg-pp-text-muted`)으로 표시한다.
- 라운지 카테고리 색(레슨·대회 등)은 텍스트나 무채색 배지로 바꾼다. 구분이 꼭 필요하면 카테고리별 아이콘 안을 라운지 묶음에서 **시안으로 먼저 보여준다.**

### 아직 확인이 필요한 것 (사용자)

1. **다크 모드 톤:** 두 번의 요청 모두 선택지("[중립 다크 유지 / slate 남색으로 되돌리기]")가 비어 있었다. 현재는 중립 다크(채도 약 20%)다. slate로 되돌리려면 `src/app/globals.css`의 `@media (prefers-color-scheme: dark) :root`와 `.pp-ui[data-ui-mode="dark"]` 두 블록을 아래 값으로 바꾸고 `scripts/ui-visual.ts`의 다크 배경 기대값을 `rgb(11, 17, 32)`로 고친다.

| 토큰 | 중립 다크(현재) | slate 다크 |
| --- | --- | --- |
| `--pp-background`, `--pp-surface` | `#0e1116` | `#0b1120` |
| `--pp-card` | `#161a21` | `#131c2e` |
| `--pp-surface-muted` | `#1f242c` | `#1e293b` |
| `--pp-border`, `--pp-card-border` | `#262c35` | `#1e293b` |
| `--pp-border-strong` | `#3a414c` | `#334155` |
| `--pp-control-border` | `#6f7886` | `#6b7a93` |
| `--pp-text` | `#e6e9ef` | `#e2e8f0` |
| `--pp-text-muted` | `#9aa3b0` | `#94a3b8` |

2. **Toast/확인 대화상자 구현 착수 시점** (G8). 컴포넌트 추가 자체는 승인됐다(2026-10-22, 의존성 추가 없이).

## 1. 작업 원칙 (모든 묶음 공통)

- **기준 컴포넌트:**
  - `src/components/club-card.tsx`: 핵심 정보는 텍스트, 순위는 한 가지 스타일, 링크는 `linkStyles()`, 보조 행동은 44px outline 버튼과 `iconButtonStyles()`
  - `src/components/find-club-banner.tsx`: 화면의 유일한 primary
  - `src/components/feedback-banner*.tsx`: 사용자 이미지 위 글자는 무채색 그라데이션 위에
  - `src/components/bottom-nav.tsx`: 활성 탭은 `text-pp-link`
- **레시피** (`@/components/ui/styles`): `buttonStyles`, `iconButtonStyles`, `linkStyles`, `surfaceStyles`, `fieldStyles`, `badgeStyles`, `filterChipStyles`, `segmentedItemStyles`, `overlayStyles`.
  - 새 컨트롤은 프리미티브(`@/components/ui`)를 우선 쓴다.
  - Surface의 `density: "none"`일 때만 패딩 유틸리티 허용.
  - 카드 높이 맞춤은 `h-full`.
  - 아이콘만 있는 버튼은 반드시 `iconButtonStyles`.
- **색:**
  - `pp-*` 토큰만 쓴다: 본문 `text-pp-text`, 보조 `text-pp-muted`, 강조 텍스트 `text-pp-brand-strong`, 링크 `text-pp-link`, 선택 배경 `bg-pp-accent-soft`.
  - 상태 색(성공·경고·에러·포인트)은 텍스트나 아이콘으로만(P3).
  - 원색 Tailwind 클래스(`bg-zinc-100`, `text-blue-600` …)와 hex는 `scripts/ui-policy.json`에 사유가 적힌 예외에서만.
- **하지 말 것:**
  - `dark:` 덮어쓰기(토큰이 이미 다크 대응)
  - `text-[10px]`/`[11px]`(②의 micro 토큰 전까지는 `text-xs` 또는 `text-[13px]`)
  - `rounded-xl/2xl/3xl`(레시피 radius나 `rounded-pp-card`/`rounded-pp-control`)
  - 장식용 `shadow-*`
  - 사용자 이미지·아트워크 밖의 그라데이션
  - 레시피 요소에 색·글자 크기·높이 유틸리티 덧붙이기(`ui:check`가 막음)
- **검증 (묶음마다):**
  1. `npm run typecheck` (pre-commit hook도 실행), `npm run ui:check`, `npm run ui:test`
  2. dev 서버를 띄운다: `npx next dev --port 3200`. 세션이 길면 백그라운드 실행 시간 제한에 주의한다.
  3. `UI_BASE_URL=http://localhost:3200 npm run ui:visual` (갤러리 24개 조합, 통과/실패만 판정)
  4. 공유 CSS·레시피를 바꿨다면 갤러리 픽셀 비교를 한다: 변경 전 상태로 서버를 재시작해 `node scripts/ui-gallery-diff.mjs capture /tmp/a`, 변경 후 재시작해 `capture /tmp/b`, 그다음 `diff /tmp/a /tmp/b`. 의도하지 않은 차이는 0이어야 한다.
  5. 공개 화면 before/after: `node scripts/ui-route-shots.mjs before /ko/clubs …` → 수정 → `node scripts/ui-route-shots.mjs after …`. 결과는 `artifacts/ui/routes/`(git 제외).
  6. `docs/design-system-routes.json`의 해당 라우트 `migration`/`verification` 상태와 evidence를 갱신한다.
  7. `npx vitest run` 전체: 실패가 `docs/known-issues.md` §1의 7개와 이름까지 같아야 한다.
  8. 묶음별 커밋(Lore 형식: 제목 + 이유 + `Constraint/Confidence/Scope-risk/Reversibility/Tested/Not-tested` 트레일러). 커밋 후 `git push`(백업용).
- **로그인이 필요한 화면**은 런타임으로 열지 않는다. 갤러리 예시나 `tests/ui/*` 컴포넌트 테스트로 검증하고 §5 "수동 확인 필요"에 남긴다.

## 2. 공통(교차) 작업 — 페이지 묶음보다 먼저 하면 편한 것

| # | 작업 | 대상 | 규칙 | 완료 조건 |
| --- | --- | --- | --- | --- |
| G1 | 상태 색 맵 통일: 경기·참가 상태를 한 모듈(예: `src/lib/status-tones.ts`)에서 `badgeStyles` tone으로 | `match-card.tsx` `statusColors`(emerald/zinc/red), `my-match-list.tsx`(green/blue/amber/yellow/red -100/-800), `participant-list.tsx` `statusColors`, `match/[id]/page.tsx` 배지 21개 | P3, P9, P10 | 상태 하나에 스타일 하나. 원색 클래스 0. 카드·행마다 상태 배지는 하나, 나머지는 텍스트 |
| G2 | `src/components/lounge-theme.ts` 폐기: 금색·카테고리 hex 클래스를 P5 토큰으로(`bg-pp-accent`, `text-pp-link`, `bg-pp-accent-soft`, `text-pp-brand-strong`) | `lounge-business-detail`, `lounge-card`, `lounge-event-card`, `lounge-calendar-view`, `lounge-page-client`, `date-filter` (27곳) | P5, P1 | `lounge-theme.ts` import 0, 파일 삭제. 카테고리는 텍스트나 무채색 배지 |
| G3 | `dark:` 중복 제거(`text-pp-text dark:text-white` 등) | 45곳 (`youth-client` 9, `find-club-wizard` 6, `about-page-content` 4 …) | Rules 4 | `grep -rE "(text\|bg\|border)-pp-[a-z-]+ dark:" src` 결과 0 |
| G4 | 사용자 이미지·아트워크 밖 그라데이션 제거 | `mypage/points` 앰버 히어로, `lounge-contact-menu` 인스타 그라데이션, `find-club-wizard`, `tamagotchi-*`/`daily-hockey-fortune-*` 주변 컨트롤 | P1, P3 | 위 파일에 `gradient` 없음(아트워크 내부 제외) |
| G5 | 외부 브랜드 색: 카카오·인스타는 무채색 아이콘 버튼. 카카오/네이버 **로그인** 버튼만 브랜드 색 | `lounge-contact-menu`(`#FEE500`, 인스타 그라데이션) | P3 | 로그인 외에 `#fee500`/인스타 색 없음 |
| G6 | 직접 만든 모달·시트 → ② `Dialog`/`Sheet` | `delete-account-modal`, `onboarding-form` 확인 모달, `notification-guide-modal`, `chat-user-selector`, 필터 드로어 3종, `tamagotchi-closet`, `clubs/[id]/card`·`mypage/card` 전체 화면 | ②-2g | Esc 닫기, 포커스 복원, 스크롤 잠금, `aria-labelledby`. `tests/ui/overlay-state-sync.test.tsx`(드로어·옷장 상태 동기화) 계속 통과 |
| G7 | 미동작 클래스 정리 | `animate-in`·`fade-in`·`slide-in-from-*`·`zoom-in-*`(약 50곳), `pt-safe`, `pb-safe-bottom` | ②-2h | 클래스를 `globals.css`에 정의하거나 제거. 미정의 클래스 0 |
| G8 | `alert()` → Toast, `confirm()` → 확인 대화상자 | 사용자 영역 59곳 (아래 상세) | P7 | 아래 조건 |

### G8 상세 — `alert()`/`confirm()` 대체

**먼저 만들 것 (② 규칙대로 갤러리, 테스트, 문서 포함):**
- `Toast`: 레이아웃 수준 provider와 `useToast()`. 페이지 이동 뒤에도 메시지가 남아야 한다. `role="status"` 또는 `alert`.
- `ConfirmDialog`: `await confirm({ title, description, confirmLabel, tone })` → `Promise<boolean>`. 네이티브 `<dialog>` 기반. 기본 포커스는 "취소", 위험한 행동은 `tone: "danger"`. 문구는 기존 i18n 문자열을 그대로 쓴다.

**`alert()` → Toast: 일괄 교체 가능 (50곳).**
- 파일별 개수: `notification-guide-modal` 8, `youth-client` 6, `push-manager` 4, `home-client` 4, `start-chat-button` 3, `post-detail-client` 3, `join-club-button` 3, `club-vote-button` 3, `youth-write-client` 2, `club-subscribe-button` 2, `chat-user-selector` 2, 1곳씩: `profile-editor`, `onboarding-form`, `match-share-button`, `lounge-share-button`, `find-club-wizard`, `club-share-button`, `chat-room-client`, `charge-form`, `mypage/card/page.client`, `clubs/[id]/card/page.client`.
- 주의: `alert`는 사용자가 닫을 때까지 다음 줄을 멈추지만 Toast는 멈추지 않는다. alert 직후 이동하는 3곳은 Toast가 이동 후에도 보이는지 확인한다. 이 때문에 provider가 레이아웃에 있어야 한다.
  - `home-client.tsx:222` (→ `router.push`)
  - `profile-editor.tsx:199` (→ `router.push`)
  - `post-detail-client.tsx:128` (→ `router.refresh`)

**`confirm()` → 확인 대화상자: 호출부마다 흐름을 확인하고, 삭제·취소·결제는 테스트를 먼저 쓴 뒤에만 바꾼다.**

동기 `confirm()`이 비동기 `await`로 바뀌면 대화상자가 떠 있는 동안 버튼이 계속 눌릴 수 있다. 9곳 모두 `loading`/`isSubmitting`이 **확인 이후에야** 켜지기 때문이다. 대화상자가 열릴 때 바로 잠그거나 대화상자 자체가 중복 호출을 막아야 한다.

| 위험 | 위치 | 행동 | 확인 후 실행 | 바꾸기 전 필요한 테스트 |
| --- | --- | --- | --- | --- |
| **결제·환불** | `match-application.tsx:107` `handleCancel` | 경기 신청 취소. 환불 가능 여부에 따라 문구가 달라짐(`confirmCancel` / `confirmCancelNoRefund` / 팀 매칭) | `cancelJoin(matchId)` → `router.refresh()` | 세 문구 분기, 취소 선택 시 `cancelJoin` 미호출, 확인 시 1회만 호출(연타), 에러 표시 |
| **취소(탈퇴)** | `club-subscribe-button.tsx:42` `handleToggle` | 소속팀 나가기 | `unsubscribeFromClubNews` | 취소 시 미호출, 확인 시 1회, 실패 alert(→Toast) |
| **삭제** | `post-detail-client.tsx:88` | 댓글 삭제 | `deleteParentComment` → 목록에서 제거 | 취소 시 목록 유지, 확인 시 1회 |
| **삭제** | `post-detail-client.tsx:101` | 게시글 삭제 | `deleteParentPost` → `/youth`로 이동 | 확인 시 1회, 이동 |
| **삭제** | `youth-client.tsx:185` | 게시글 삭제 | `deleteParentPost` → 목록에서 제거 | 위와 동일 |
| **삭제** | `youth-client.tsx:224` | 소식 삭제 | `deleteParentNews` | 위와 동일 |
| 소속 변경 | `profile-editor.tsx:133` `handleSave` | 주 소속 클럽이 내 클럽이 아니면 가입 확인 | 저장 흐름 계속(가입 포함) | 취소 시 저장 중단, 확인 시 저장 1회 |
| 가입 | `join-club-button.tsx:25` `handleJoin` | 동호회 가입 | `joinClub` | 취소 시 미호출, 확인 시 1회 |
| 생성 | `chat-user-selector.tsx:61` `handleUserClick` | 채팅방 만들기 | `createOrGetRoom` → 이동 | 확인 시 1회, 이동 |

- 관리자 화면의 `confirm()` 14곳(`admin-*`, `superuser-*`, `approve-rink-button`, `charge-requests-list` 등)은 **범위 밖**이다. 관리자까지 확장할 때는 같은 표를 따로 만든다.
- 테스트는 `tests/ui/`에 `@testing-library/react`로 작성하고 서버 액션은 `vi.mock`한다. `tests/ui/special-behavior.test.tsx`의 mock 패턴을 참고한다.

## 3. 페이지 묶음 (권장 순서)

표의 숫자는 2026-10-22 정적 집계다. 원색은 Tailwind 팔레트 색 클래스, radius는 하드코딩된 `rounded-*`, micro는 `text-[8~11px]`를 뜻한다. 작업 전에 같은 방식으로 다시 세서 줄었는지 확인한다.

### 묶음 1 — 홈 나머지 탭과 공통 셸

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `match-card.tsx` (원색 24, micro 5, radius 4) | 상태 색 맵, 상단 강조선 `bg-[#172554]`, 대여 배지·시간 등 색 4~5개 | G1, P7(강조색 1개), P8(시간·장소는 텍스트 위계). 기준: `club-card.tsx` |
| `rink-explorer.tsx`, `rink-map.tsx` (원색 8, 그림자 2) | 링크장 카드의 클럽 칩, 지도 버튼 색 | P9(칩 → 텍스트) |
| `home-client.tsx` (원색 3, alert 4) | 경기 탭 필터·토글, 빈 상태 | P6, ② `EmptyState`, G8 |
| `calendar-view.tsx`, `date-filter.tsx` | 날짜 셀 선택색, 오늘 표시, 라운지 금색 분기(`date-filter`) | G2, P6(선택 = 브랜드 기본) |
| `skeletons.tsx` (radius 5) | 하드코딩 radius | 토큰 |

**완료 조건:** `/ko/clubs`, `/ko/rinks`, `/ko?tab=match`의 before/after가 P1~P11에 맞을 것. 경기 카드 한 장의 색이 4계열 이내, 강조색 하나.

### 묶음 2 — 상세 화면

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `(public)/match/[id]/page.tsx` (배지 21: success 7, warning 6, brand 6, neutral 2; radius 11) | 배지 남용, 정보마다 색 | P9(정보는 텍스트), G1, P8 |
| `match-application.tsx` (radius 14, micro 6) | 신청 단계별 색 블록, 하드코딩 radius | P7(주요 행동 1개 = 신청), P3. **결제·신청 로직과 `confirm()`은 G8 표대로** |
| `participant-list.tsx` (원색 8) | 상태 글자색 맵 | G1 |
| `(public)/clubs/[id]/page.tsx` (배지 4) | 상단 배지, 액션 버튼(46px 클럽 액션 규칙 유지) | P9, `club-detail-action-styles.ts` 유지 |
| `(public)/clubs/[id]/card/page.client.tsx` (원색 11, radius 11) | 카드 캔버스(**제외**) 주변 컨트롤, 전체 화면 오버레이 | `data-ui-artwork` 유지, 주변만. G6 |
| `(public)/rinks/[id]/page.tsx` | 섹션 radius | ② `Section` |
| `find-club-wizard.tsx` (dark 중복 6, 배지 3, 그라데이션 1) | 결과 배지, 옵션 카드 | P9, G3, G4 |

**완료 조건:** 상세 화면마다 primary 하나, 상태 배지 하나, 숫자 정보는 텍스트.

### 묶음 3 — 마이페이지·포인트·프로필 (전부 로그인 필요 → §5)

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `(public)/mypage/points/page.tsx` (원색 26, 그라데이션 1) | 앰버 그라데이션 잔액 히어로 | G4, P3(포인트 색은 아이콘·숫자만). `scripts/ui-policy.json`의 해당 예외 삭제 |
| `my-match-list.tsx` (원색 28) | 상태별 배경 배지 6색 | G1 |
| `(public)/mypage/card/page.client.tsx` (micro 5, 모달 2) | 카드 캔버스(**제외**) 주변, 전체 화면 | G6 |
| `charge-form.tsx`, `copy-bank-account.tsx`, `copy-button.tsx` | 복사 버튼 색, radius | `iconButtonStyles`, P3. **충전 제출은 실행 금지** |
| `profile-editor.tsx`, `profile-form.tsx`, `birth-date-picker.tsx` | 아바타 링·그림자, 날짜 팝오버 | 토큰, 팝오버는 `--pp-shadow-overlay` |
| `notification-status.tsx`, `notification-guide-modal.tsx` (alert 8) | 상태 박스 green/amber 배경 | P3, G6, G8 |
| `tamagotchi-*`, `daily-hockey-fortune-*` | 아트워크(**제외**) 주변 버튼·탭 | 주변 컨트롤만 |

### 묶음 4 — 라운지 (P5 금색 계열)

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `lounge-page-client.tsx`, `lounge-card.tsx`, `lounge-event-card.tsx`, `lounge-calendar-view.tsx` | `lounge-theme.ts` hex, 카테고리 6색 | G2, P5. 카테고리 구분이 필요하면 **아이콘 안을 시안으로 먼저**(`artifacts/ui/mockups/` 방식: 실제 `globals.css` + 레시피를 정적 렌더) |
| `lounge-business-detail.tsx` (hex 3, radius 8) | 금색 하드코딩. 커버 높이 `h-64 md:h-80`은 배너 규격 문서와 연동 | G2. 커버 높이를 바꾸면 `docs/lounge-home-banner-spec.md`도 함께 수정 |
| `lounge-contact-menu.tsx` (원색 9, hex 6) | 카카오 노랑·인스타 그라데이션 버튼 | G5 |
| `(brochure)/lounge-membership/page.tsx` (hex 11, radius 17, 그라데이션 5) | 브로셔. 정책 예외로 금색·인스타 그라데이션 허용 중 | P5 기준으로 예외를 다시 검토(브로셔 전체를 아트워크로 볼지 사용자에게 확인) |
| `lounge/[businessId]/notices/[noticeId]/page.tsx` (radius 5) | 상세 레이아웃 | ② `PageHeader`, `Section` |

**완료 조건:** 라운지 화면에 파랑(`#2563eb`)이 없을 것(헤더 로그인·하단 내비 활성 포함). 금색 기본 버튼 글자는 near-black.

### 묶음 5 — 청소년 (P5 보라 계열)

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `youth-client.tsx` (radius 13, micro 8, dark 중복 9, alert 6, confirm 2) | 혜택 카드 아이콘 색 3종(accent/info/success soft), 대기 카드, 탭 | P1(혜택 아이콘은 브랜드 연함 하나), G3, G8 |
| `post-detail-client.tsx`, `youth-write-client.tsx`, `youth-access-banner.tsx` | 좋아요 빨강, 버튼 radius | P3(좋아요는 아이콘만), 레시피 |

**완료 조건:** 청소년 화면에 파랑이 없을 것. 인증 상태(미신청·대기·승인)별 화면은 고정 예시로 확인할 것(승인 상태는 렌더링 중 DB 쓰기가 있으니 로그인 런타임 금지).

### 묶음 6 — 채팅·온보딩·인증·정적 페이지

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `chat-list-client.tsx` (원색 8), `chat-room-client.tsx`, `chat-user-selector.tsx`, `start-chat-button.tsx` | 읽지 않음 배지 색, 말풍선 색 | P3, P9. 읽음 처리 로직은 건드리지 않음 |
| `onboarding-form.tsx` (모달 1) | 확인 모달 | G6 |
| `(public)/login`, `signup`, `admin-apply` | 카카오·네이버 로그인 버튼(브랜드 색 유지가 정답) | P3 확인만 |
| `about-page-content.tsx` (원색 54) | SEO 공용 렌더러. 레거시 분기는 봇용으로 유지 | 사용자 경로 분기만 P1~P11로. 봇 출력은 바꾸지 않음(`tests/ui/isolation.test.ts`) |
| `privacy`, `terms` | 문서형 레이아웃 | ② `PageContainer`(narrow) |
| `install-prompt.tsx`, `push-manager.tsx`, `src/app/global-error.tsx` | 전역 오버레이 색·그림자 | 오버레이 토큰 |

## 4. ② 남은 토큰·컴포넌트

| # | 항목 | 상태 |
| --- | --- | --- |
| 2-CSS | `pp-*`의 `@layer components` 이동 | **완료** (`5ee7532`) |
| 2-i | `iconButtonStyles`, `linkStyles` | **완료** |
| 2-a | 타이포 토큰(`text-pp-micro` 11 / caption 12 / body 14 / body-lg 16 / heading 18 / title 24 / display 30, 굵기 400/500/600/700), `Heading`/`Text` | 남음 |
| 2-b | 간격 토큰(`--pp-page-x` 16/24, `--pp-section-gap` 32/40, `--pp-stack-gap` 8/12/16) | 남음 |
| 2-c | `PageContainer` (narrow 480 / default 672 / wide 1024) | 남음 |
| 2-d | `Section` + 섹션 간격 규칙(페이지 헤더→첫 섹션 24, 섹션 사이 `--pp-section-gap`, 제목→내용 12~16) | 남음 |
| 2-e | `PageHeader` (`mypage-subpage-header.tsx` 일반화, 뒤로가기 직접 구현 16개 파일 대체) | 남음 |
| 2-f | `EmptyState` (빈 상태 19개 파일) | 남음 |
| 2-g | `Dialog`/`Sheet` 동작 | 남음 (G6) |
| 2-h | 미동작 클래스 | 남음 (G7) |
| 2-j | `Toast`, `ConfirmDialog` | 남음 (G8) |

새 컴포넌트는 구현, 갤러리 예시(`src/components/ui/design-system-gallery.tsx`), 동작 테스트(`tests/ui/primitives.test.tsx` 등), `docs/design-system.md` 표 갱신을 **같은 커밋**에 넣는다. 레시피를 추가하면 `scripts/ui-policy.ts`의 `recipe` 정규식에도 이름을 넣는다.

## 5. 수동 확인 필요 (로그인 필요 → 런타임 미검증)

자동 검사(`ui:check`, `ui:test`, 갤러리)는 통과했지만 **실제 로그인 화면은 열어 보지 않은** 곳이다. 사람이 테스트 계정으로(가능하면 운영 DB가 아닌 환경에서) 확인한다. 확인하면 `docs/design-system-routes.json`의 `verification`을 갱신하고 이 표에서 지운다.

### 이번 작업으로 바뀐 것 중 로그인 화면에서만 보이는 것

| 화면 | 바뀐 점 | 확인할 것 | 커밋 |
| --- | --- | --- | --- |
| 헤더 사용자 메뉴 (로그인 후 아무 화면) | 메뉴 항목 정렬이 가운데 → 왼쪽(원래 의도) | 아이콘·두 줄 텍스트가 왼쪽 정렬, 잘림 없음 | `5ee7532` |
| `/chat` 새 채팅 → 상대 선택 | 행이 파란 버튼 → 카드형 행(아바타 40px + 두 줄) | 행 높이, 잘림, 생성 중 비활성 | `77f0505` |
| `/chat/[roomId]` | 뒤로가기 → 정사각 아이콘 버튼 | 크기, 터치 영역 | `7380726` |
| `/match/[id]` (신청한 상태) | 신청 정보 행 `px-2 py-3` 복구, 참가자 행 `px-4 py-3` | 여백, 정렬 | `77f0505` |
| `/mypage/tamagotchi` | 옷장 진입 버튼 → 카드형(20px 패딩) | 아이콘 40px + 텍스트가 잘리지 않음 | `77f0505` |
| `/mypage/points/charge` | 금액·입금자명 라벨 아래 간격 | 라벨과 입력 사이 8px | `77f0505` |
| `/mypage/profile` | 이메일 라벨 간격, 하키 시작 "월" 선택 폭(`w-24`가 이제 적용됨) | 연·월 선택 폭과 정렬 | `5ee7532`, `77f0505` |
| `/youth` (승인 학부모) | 닉네임 편집·소식 이미지 버튼 → 아이콘 버튼, 닉네임 입력 폭(`w-28` 적용) | 크기와 정렬 | `5ee7532`, `7380726` |
| `/youth` (신청 대기) | 대기 카드 패딩 0 → 32px | 카드 여백 | `77f0505` |
| `/mypage/fortune` | 뒤로가기 → 정사각 아이콘 버튼 | 크기 | `7380726` |
| 마이페이지 하위 화면 공통 | 원형 뒤로가기(타원이 되던 문제 수정) | 원형 유지 | `7380726` |
| PWA 설치 안내(설치 가능한 브라우저) | 닫기 버튼 → 원형 아이콘 버튼 | 위치(`-top-2 -right-2`), 크기 | `7380726` |
| 동호회 카드(로그인 상태) | 투표 후 "오늘 투표 완료" outline 비활성, 하트 비움 | 상태 표시, 연타 방지 | `981959a` |
| 다크 모드 전체 | 중립 다크 토큰 | 로그인 화면의 카드·입력 경계 대비 | `981959a` |

### 원래부터 런타임 검증이 없는 로그인 필요 라우트

`docs/design-system-routes.json`에서 `authCoverage: "required"`인 화면이다. 모두 `verification: pending`이다.
- `/chat`, `/chat/[roomId]`
- `/mypage`, `/mypage/card`, `/mypage/clubs`, `/mypage/language`, `/mypage/matches`, `/mypage/notifications`, `/mypage/points`, `/mypage/points/charge`, `/mypage/profile`, `/mypage/tamagotchi`, `/mypage/fortune`
- `/profile`, `/youth/write`, `/onboarding`

`public-and-authenticated-states` 라우트(홈, 동호회·링크장·경기 상세, 라운지, 청소년 등)는 **로그인 상태 화면**(투표 완료, 신청 상태, 구독 상태, 승인 학부모 피드)이 미검증이다.

**주의:** `/mypage/matches`, `/mypage/points/charge`, `/mypage/fortune`, `/chat/[roomId]`, `/youth/*`는 페이지를 열기만 해도 DB에 쓴다(`docs/known-issues.md` §2). 운영 계정으로 확인할 때는 그 영향(신청 자동 취소, 조회수, 읽음 처리 등)을 감수할 수 있는지 먼저 판단한다.

## 6. 다음 세션 시작 절차

1. `git switch codex/design-system && git pull` (작업 트리가 깨끗한지 `git status`로 확인)
2. 이 문서 → `docs/design-system.md`(Rules, P1~P11, 컴포넌트 표) → `docs/known-issues.md` 순으로 읽는다.
3. §0 "아직 확인이 필요한 것" 중 이번 묶음에 걸리는 것이 있으면 먼저 사용자에게 묻는다.
4. 묶음 하나(또는 공통 작업 하나)를 고른다. 정적 집계를 다시 실행 → 수정 → §1 검증 → before/after → 커밋 → 푸시 → 이 문서의 §0 표와 해당 묶음, §5를 갱신한다.
5. 모든 묶음이 끝나면 Draft PR을 만든다. `.github/PULL_REQUEST_TEMPLATE.md` 양식을 따르고, 미검증 범위(§5)를 명시한다. `main` 머지는 사용자 리뷰 후에만 한다.
