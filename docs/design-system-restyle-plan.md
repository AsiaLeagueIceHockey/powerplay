# 디자인 시스템 리스타일 계획 (인계 문서)

- 최종 갱신: 2026-10-22 · 브랜치 `codex/design-system` (원격에 백업 푸시됨, PR은 아직 없음)
- 이 문서만 보고 다음 작업을 이어갈 수 있게 쓴다. 규칙과 토큰 값의 기준은 `docs/design-system.md`(특히 "Rules at a glance"와 "Palette and hierarchy rules" P1~P11)다. 방향과 결정 이력은 `decisions/design-system.md`에 있다.
- 범위: 일반 사용자 UI. 관리자(`/admin`), SEO 봇 렌더러(`src/app/seo-bot`), 이미지 내보내기 캔버스(인스타그램, 카드뉴스, 선수·클럽 카드 캔버스, 운세·타마고치 아트워크)는 제외한다. 단, 아트워크 **주변의 일반 컨트롤**은 범위에 들어간다.
- 공통 제약:
  - 비즈니스 로직, API, 상태 관리, DB 스키마는 바꾸지 않는다.
  - 새 라이브러리는 추가하지 않는다. 필요하면 먼저 묻는다.
  - 문구는 바꾸지 않는다. 바꾸는 편이 낫다고 판단하면 제안만 한다.
  - dev 서버로 확인할 때는 `CLAUDE.md`의 "검증 안전 규칙"을 따른다. `.env.local`이 운영 DB를 가리키고, 렌더링 중 DB에 쓰는 GET 경로가 있다(`docs/known-issues.md` §2).

## 0. 현재 상태

### 완료 (커밋 순서)

| 단계 | 커밋 | 내용 |
| --- | --- | --- |
| 공유 계층 | `dc44f6b`~`d787ac0` | `pp-*` 토큰, 프리미티브와 레시피, 갤러리(`/dev/design-system`), `ui:check`/`ui:test`/`ui:visual`, 사용자 화면 마이그레이션 |
| ① 토큰 1차 | `1caa308` | radius 8px(모달 12px), 테두리만 있는 카드, 여백 확대, 칩·배지 pill, 다크 카드 한 단계 띄우기 |
| 경계선·로고 | `5d01580` | `--pp-control-border`(입력 경계 3:1 이상), 다크 로고 투명 처리(임시. SVG가 생기면 `public/header-logo-dark.webp` 교체) |
| CSS 레이어 | `5ee7532` | `pp-*` 규칙을 `@layer components`로 이동해 Tailwind 유틸리티가 이기게 함. 갤러리 픽셀 차이 0 |
| 회귀 복구 | `77f0505` | 마이그레이션에서 빠진 레이아웃 복구(월간 랭킹 여백, 라운지 지도 높이, 공지 행 등). `ui:check`가 `density: "none"` Surface의 패딩만 허용하도록 수정 |
| 아이콘 버튼 | `7380726` | `iconButtonStyles()` 레시피 추가, 아이콘 전용 버튼 19곳 통일(카카오 "점" 아이콘 해결) |
| 팔레트 A + 홈 | `981959a` | 팔레트 A(Slate) + 중립 다크 + P5(섹션별 색 계열) + P4-2(응원 = 브랜드색) 토큰 적용, `linkStyles()`, 동호회 카드 A안, 클럽 찾기 = 유일한 primary, 로그인 secondary, 하단 내비 불투명 |

### 남은 결정 (사용자)

1. **다크 모드:** 2026-10-22 요청의 선택지가 비어 있어 "채도를 낮춘 중립 다크"(채도 약 20%)로 적용했다. 되돌리려면 `globals.css`의 다크 블록 값만 바꾸면 된다(slate 값은 `docs/design-system.md` 이력 참고).
2. **홈 배너:** 유료(스폰서) A(진한 남색) / B(클럽 이미지 크게), 자체 배너를 캐러셀 안에 둘지 밖에 둘지. 시안은 로컬 `artifacts/ui/mockups/out/board-banners-v2.png`. 커밋되지 않으며 `artifacts/ui/mockups/banners.tsx`를 실행하면 다시 생성된다.
3. **광고 표시 문구:** "광고" 또는 "스폰서"(영문 "Ad" / "Sponsored"). 새 문구라 승인이 필요하다.
4. **하단 내비 라운지 탭의 금색 반짝임:** 비활성 상태에서도 금색이 반짝이는 애니메이션이라 P5("파랑 페이지에 금색 금지")와 충돌한다. 유지할지 없앨지.
5. **`alert()`/`confirm()` 59곳의 대체:** Toast·ConfirmDialog 컴포넌트를 새로 만들지(의존성 추가 없이).

### 유료/자체 배너 구분 방법 (제안만, DB 변경 없음)

- 현재 구분 필드는 없다. 홈 배너는 `lounge_businesses.home_banner_enabled`/`home_banner_title`/`home_banner_description`/`home_banner_order`(v43)로 켜고, 인스타그램·오픈채팅은 `src/components/feedback-banner.tsx`에 하드코딩돼 있다.
- **단기(코드만):** 출처로 구분한다. 라운지 비즈니스에서 온 배너는 `kind: "sponsor"`, 하드코딩 배너는 `kind: "house"`로 `feedback-banner.tsx`의 배너 객체에 필드를 추가한다. 캐러셀은 sponsor를 `home_banner_order` 순으로 항상 앞에 둔다. B안 이미지는 `cover_image_url`, 없으면 `logo_url`로 대체한다.
- **엄밀하게 하려면(DB 변경, 별도 승인):** `lounge_businesses.home_banner_kind`(`'sponsor' | 'partner'`)나 `home_banner_sponsored boolean`을 추가하거나, 활성 `lounge_memberships`(소유자 기준, `status = 'active'`이고 기간 내)가 있을 때만 "광고" 표시를 붙인다.

## 1. 작업 원칙 (모든 묶음 공통)

- **기준 컴포넌트:**
  - `src/components/club-card.tsx`(A안): 핵심 정보는 텍스트, 순위는 한 가지 스타일, 링크는 `linkStyles()`, 보조 행동은 44px outline 버튼과 `iconButtonStyles()`
  - `src/components/find-club-banner.tsx`: 화면의 유일한 primary
  - `src/components/bottom-nav.tsx`: 활성 탭은 `text-pp-link`
- **레시피:**
  - `buttonStyles`, `iconButtonStyles`, `linkStyles`, `surfaceStyles`, `fieldStyles`, `badgeStyles`, `filterChipStyles`, `segmentedItemStyles`, `overlayStyles`(`@/components/ui/styles`)
  - Surface의 `density: "none"`일 때만 패딩 유틸리티 허용, 카드 높이 맞춤은 `h-full`
- **색:**
  - `pp-*` 토큰만 쓴다. 강조 텍스트는 `text-pp-brand-strong`, 링크는 `text-pp-link`, 경계 필드는 `--pp-control-border`(레시피가 처리)
  - 상태 색(성공·경고·에러·포인트)은 텍스트나 아이콘으로만 쓴다(P3)
- **하지 말 것:**
  - `dark:` 덮어쓰기(토큰이 이미 다크 대응)
  - `text-[10px]`/`[11px]`(②의 micro 토큰 전까지는 `text-xs` 또는 `text-[13px]`)
  - `rounded-xl/2xl/3xl`(레시피 radius 사용)
  - 장식 `shadow-*`
  - 그라데이션(사용자 이미지와 아트워크만 예외)
- **검증:**
  - `npm run typecheck`, `npm run ui:check`, `npm run ui:test`, `UI_BASE_URL=http://localhost:3200 npm run ui:visual`
  - 묶음별 before/after 스크린샷(로그아웃, GET/HEAD 외 요청 차단, `artifacts/ui/home/shoot.mjs` 참고)
  - `docs/design-system-routes.json`의 migration/verification 상태 갱신
  - 묶음별 커밋
- **알려진 실패:** 테스트 7개는 원래부터 실패한다(`docs/known-issues.md` §1). 새로 생긴 실패만 막는다.

## 2. 공통(교차) 작업 — 페이지 묶음보다 먼저 하면 편한 것

| # | 작업 | 대상 | 규칙 | 완료 조건 |
| --- | --- | --- | --- | --- |
| G1 | 상태 색 맵 통일: 경기·참가 상태별 색을 한 모듈(예: `src/lib/status-tones.ts`)과 `badgeStyles` tone으로 | `match-card.tsx` `statusColors`, `my-match-list.tsx`(green/blue/amber/yellow/red -100/-800), `participant-list.tsx` `statusColors`, `match/[id]/page.tsx` 배지 21개 | P3, P9, P10 | 상태 하나에 스타일 하나. 원색 클래스 0. 상태는 배지 하나, 나머지는 텍스트 |
| G2 | `lounge-theme.ts` 폐기: 금색·카테고리 hex 클래스를 P5 토큰으로(`bg-pp-accent`, `text-pp-link`, `bg-pp-accent-soft` 등) | `lounge-business-detail`, `lounge-card`, `lounge-event-card`, `lounge-calendar-view`, `lounge-page-client`, `date-filter`(사용처 27곳) | P5, P1 | `lounge-theme.ts` import 0. 카테고리는 텍스트나 무채색 배지(카테고리별 아이콘 안은 라운지 묶음에서 시안으로) |
| G3 | `dark:` 중복 제거(`text-pp-text dark:text-white` 등) | 45곳 (`youth-client` 9, `find-club-wizard` 6, `about-page-content` 4 …) | Rules 4 | `grep -E "(text|bg|border)-pp-[a-z-]+ dark:"` 결과 0 |
| G4 | 이미지 이외 그라데이션 제거 | `mypage/points` 앰버 히어로, `lounge-contact-menu` 인스타 그라데이션, `bottom-nav` 반짝임, `tamagotchi-*`/`daily-hockey-fortune-*` 주변 컨트롤, `find-club-wizard` | P1, P3 | 그라데이션은 사용자 이미지와 아트워크 안에만 |
| G5 | 외부 브랜드 색 정리: 카카오·인스타는 무채색 아이콘 버튼으로. 카카오 로그인 버튼만 브랜드 색 | `lounge-contact-menu`(`#FEE500`, 인스타 그라데이션), `feedback-banner`(배너 결정 뒤) | P3 | 공식 가이드상 필요한 곳 외에 `#fee500`/인스타 색 없음 |
| G6 | 직접 만든 모달·시트 → ② `Dialog`/`Sheet` | `delete-account-modal`, `onboarding-form`, `notification-guide-modal`, `chat-user-selector`, 필터 드로어 3종, `tamagotchi-closet`, `clubs/[id]/card`·`mypage/card` 전체 화면 | ②-2g | Esc 닫기, 포커스 복원, 스크롤 잠금, `aria-labelledby`. `tests/ui/overlay-state-sync.test.tsx` 통과 |
| G7 | 미동작 클래스 정리 | `animate-in`·`fade-in`·`slide-in-from-*`·`zoom-in-*`(약 50곳), `pt-safe`, `pb-safe-bottom` | ②-2h | 클래스를 정의하거나 제거. 미정의 클래스 0 |
| G8 | `alert()`/`confirm()` → Toast/ConfirmDialog (**결정 5 이후**) | 59곳 (`youth-client` 8, `notification-guide-modal` 8, `post-detail-client` 5, `join-club-button`·`push-manager`·`home-client` 각 4 …) | P7 | 네이티브 alert 0. 문구는 기존 i18n 그대로 |

## 3. 페이지 묶음 (권장 순서)

표의 숫자는 2026-10-22 정적 집계(원색 = Tailwind 팔레트 색 클래스, radius = 하드코딩 `rounded-*`, micro = `text-[8~11px]`)다.

### 묶음 1 — 홈 나머지 탭과 공통 셸

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `match-card.tsx` (원색 24, micro 5, radius 4) | 상태 색 맵(emerald/zinc/red), 상단 강조선 `bg-[#172554]`, 대여 배지·시간 등 색 4~5개 | G1, P7(강조색 1개), P8(시간·장소는 텍스트 위계), 기준: `club-card.tsx` |
| `rink-explorer.tsx`, `rink-map.tsx` (원색 8, 그림자 2) | 링크장 카드의 클럽 칩, 지도 버튼 색 | P9(칩 → 텍스트), `iconButtonStyles` 사용 확인 |
| `home-client.tsx` (원색 3, alert 4) | 경기 탭 필터 칩·토글, 빈 상태 | P6, ② `EmptyState` |
| `calendar-view.tsx`, `date-filter.tsx` | 날짜 셀 선택색, 오늘 표시, 라운지 금색 분기(`date-filter`) | G2, P6(선택 = 브랜드 기본) |
| `skeletons.tsx` (radius 5) | `rounded-*` 하드코딩 | radius 토큰 |
| `bottom-nav.tsx` | 라운지 탭 금색 반짝임(결정 4), `#f0b63a` | P5 |

**완료 조건:** `/ko/clubs`, `/ko/rinks`, `/ko?tab=match`의 before/after가 P1~P11에 맞을 것. 경기 카드 한 장의 색이 4계열 이내이고 강조색은 하나일 것.

### 묶음 2 — 상세 화면

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `(public)/match/[id]/page.tsx` (badge 21: success 7, warning 6, brand 6, neutral 2; radius 11) | 배지 남용, 정보마다 색 | P9(정보는 텍스트), G1(상태 배지 1개), P8 |
| `match-application.tsx` (radius 14, micro 6) | 신청 단계별 색 블록, 하드코딩 radius | P7(주요 행동 1개 = 신청), P3. 결제·신청 로직은 건드리지 않음 |
| `participant-list.tsx` (원색 8) | 상태 글자색 맵 | G1 |
| `(public)/clubs/[id]/page.tsx` (badge 4) | 상단 배지와 액션 버튼(46px 클럽 액션 규칙 유지) | P9, `club-detail-action-styles` 유지 |
| `(public)/clubs/[id]/card/page.client.tsx` (원색 11, radius 11, micro 6) | 카드 캔버스(**제외**) 주변 컨트롤과 전체 화면 오버레이 | 캔버스는 `data-ui-artwork` 유지, 주변 컨트롤만. G6 |
| `(public)/rinks/[id]/page.tsx` | 섹션 radius | ② `Section` |
| `find-club-wizard.tsx` (dark 중복 6, badge 3, 그라데이션 1) | 결과 배지, 옵션 카드 | P9, G3, G4 |

**완료 조건:** 상세 화면마다 primary가 하나일 것. 배지는 상태 하나만. 숫자 정보는 텍스트로 표시할 것.

### 묶음 3 — 마이페이지·포인트·프로필

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `(public)/mypage/points/page.tsx` (원색 26, 그라데이션 1) | 앰버 그라데이션 잔액 히어로(`from-amber-500 to-amber-600`) | G4, P3(포인트 색은 아이콘·숫자 텍스트만). 정책 예외(`scripts/ui-policy.json`)도 정리 |
| `my-match-list.tsx` (원색 28) | 상태별 배경 배지 6색 | G1 |
| `(public)/mypage/card/page.client.tsx` (micro 5, 모달 2) | 카드 캔버스(**제외**) 주변 컨트롤, 전체 화면 | G6 |
| `charge-form.tsx`, `copy-bank-account.tsx`, `copy-button.tsx` (원색 3) | 복사 버튼 색, radius | `iconButtonStyles`, P3 |
| `profile-editor.tsx`, `profile-form.tsx`, `birth-date-picker.tsx` | 아바타 링·그림자, 날짜 선택 팝오버 | radius·그림자 토큰, 팝오버는 `--pp-shadow-overlay` |
| `notification-status.tsx`, `notification-guide-modal.tsx` (alert 8) | 상태 박스 green/amber 배경 | P3(상태는 텍스트·아이콘), G6, G8 |
| `tamagotchi-*`, `daily-hockey-fortune-*` | 아트워크(**제외**) 주변 버튼·탭 | 주변 컨트롤만 레시피로 |

**완료 조건:** 충전·계정 삭제·알림 흐름은 실제로 제출하지 않고 화면만 확인할 것. 로그인이 필요한 화면은 고정 예시나 갤러리로 검증하고, 런타임 미검증 범위를 routes json에 적을 것.

### 묶음 4 — 라운지 (P5 금색 계열)

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `lounge-page-client.tsx`, `lounge-card.tsx`, `lounge-event-card.tsx`, `lounge-calendar-view.tsx` | `lounge-theme.ts` hex와 카테고리 6색 | G2, P5. 카테고리 구분이 필요하면 **카테고리별 아이콘 안을 시안으로 먼저 제시**(사용자 요청) |
| `lounge-business-detail.tsx` (hex 3, radius 8) | 금색 하드코딩, 공지 목록(회귀 복구됨) | G2. 기준은 홈 카드와 같은 위계 |
| `lounge-contact-menu.tsx` (원색 9, hex 6) | 카카오 노랑·인스타 그라데이션 버튼 | G5 |
| `(brochure)/lounge-membership/page.tsx` (hex 11, radius 17, 그라데이션 5) | 브로셔. 정책 예외로 금색·인스타 그라데이션이 허용돼 있음 | P5 기준으로 예외를 다시 검토(브로셔 아트워크로 볼지 결정 필요) |
| `lounge/[businessId]/notices/[noticeId]/page.tsx` (radius 5) | 상세 레이아웃 | ② `PageHeader`, `Section` |

**완료 조건:** 라운지 화면에 파랑(`#2563eb`)이 없을 것(헤더·하단 내비 활성 포함). 금색 기본 버튼의 글자는 near-black일 것.

### 묶음 5 — 청소년 (P5 보라 계열)

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `youth-client.tsx` (radius 13, micro 8, dark 중복 9, alert 8) | 혜택 카드 아이콘 색 3종(accent/info/success soft), 대기 카드, 탭 | P1(혜택 아이콘은 브랜드 연함 하나), G3, G8 |
| `post-detail-client.tsx`, `youth-write-client.tsx`, `youth-access-banner.tsx` | 좋아요 빨강, 버튼 radius | P3(좋아요는 아이콘만), 레시피 |

**완료 조건:** 청소년 화면에 파랑이 없을 것. 인증 상태(미신청·대기·승인)별 화면은 고정 예시로 확인할 것.

### 묶음 6 — 채팅·온보딩·인증·정적 페이지

| 파일 | 문제 | 적용 |
| --- | --- | --- |
| `chat-list-client.tsx` (원색 8), `chat-room-client.tsx`, `chat-user-selector.tsx`, `start-chat-button.tsx` | 읽지 않음 배지 색, 말풍선 색 | P3, P9. 읽음 처리 로직은 건드리지 않음(렌더링 중 쓰기 경로라 로그인 상태로 열지 말 것) |
| `onboarding-form.tsx` (모달 1) | 확인 모달 | G6 |
| `(public)/login`, `signup`, `admin-apply` | 카카오·네이버 provider 버튼(브랜드 색 유지가 정답) | P3 확인만 |
| `about-page-content.tsx` (원색 54) | SEO 공용 렌더러. 레거시 분기는 봇용으로 유지 | 사용자 경로 분기만 P1~P11로. 봇 출력은 바꾸지 않음(`tests/ui/isolation.test.ts`) |
| `privacy`, `terms` | 문서형 레이아웃 | ② `PageContainer`(narrow) |
| `install-prompt.tsx`, `push-manager.tsx`, `src/app/global-error.tsx` | 전역 오버레이 색·그림자 | 오버레이 토큰 |

## 4. ② 남은 토큰·컴포넌트 (묶음 작업 중 필요해지면 먼저)

| # | 항목 | 상태 |
| --- | --- | --- |
| 2-CSS | `pp-*` 규칙의 `@layer components` 이동 | **완료** (`5ee7532`) |
| 2-a | 타이포 토큰(`text-pp-micro` 11 / caption 12 / body 14 / body-lg 16 / heading 18 / title 24 / display 30), `Heading`/`Text` | 남음 |
| 2-b | 간격 토큰(`--pp-page-x`, `--pp-section-gap`, `--pp-stack-gap`) | 남음 |
| 2-c | `PageContainer` (narrow 480 / default 672 / wide 1024) | 남음 |
| 2-d | `Section` + 섹션 간격 규칙 | 남음 |
| 2-e | `PageHeader` (`MypageSubpageHeader` 일반화) | 남음 |
| 2-f | `EmptyState` | 남음 (빈 상태 19개 파일) |
| 2-g | `Dialog`/`Sheet` 동작(네이티브 `<dialog>`, Esc, 포커스 복원, 스크롤 잠금) | 남음 (G6) |
| 2-h | 미동작 클래스 정의·제거 | 남음 (G7) |
| 2-i | `iconButtonStyles`, `linkStyles` 레시피 | **완료** |

새 컴포넌트를 만들 때는 구현, 갤러리 예시, 동작 테스트, `docs/design-system.md` 갱신을 같은 커밋에 넣는다(Rules at a glance 9).

## 5. 다음 세션 시작 체크리스트

1. `git switch codex/design-system && git pull`
2. `docs/design-system.md`(Rules, P1~P11), 이 문서, `docs/known-issues.md`를 읽는다.
3. "남은 결정" 중 다음 묶음에 걸리는 것이 있으면 먼저 사용자에게 묻는다(배너, 라운지 반짝임, Toast 등).
4. 묶음 하나를 고르고: 정적 집계 다시 실행 → 수정 → 검증 → before/after → 커밋.
