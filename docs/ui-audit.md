# Power Play UI 현황 감사

- 작성일: 2026-10-21
- 기준: `codex/design-system` 브랜치 **작업 트리**(미커밋 변경 포함). 비교 기준은 HEAD `7b0e5c9`.
- 범위: `src/**/*.tsx|ts` 전체. 영역을 아래처럼 나눠 집계했다.
  - **사용자**: `(public)`, `(brochure)`, `onboarding`, `chat/[roomId]`, `mypage/fortune`, 공용 컴포넌트 (tsx 132개)
  - **관리자**: `(admin)` 라우트와 관리자 전용 컴포넌트 (`admin-*`, `superuser-*`, `match-form`, `lounge-*-manager`, `card-news-studio`, `schedule-pattern-card`, `point-status-tab`, `settings-form` 등, tsx 71개)
  - **내보내기 캔버스**: `instagram/*` (tsx 6개), **SEO 봇 렌더러**: `src/app/seo-bot` (tsx 8개)
- 방법: 정규식/브레이스 깊이 기반 정적 스캔과 수동 샘플링. 동적으로 조합한 클래스 문자열은 일부 놓칠 수 있으니 수치는 규모를 가늠하는 용도로 본다.

---

## 0. 요약

1. **스타일링은 Tailwind v4 단일 체계**이고 외부 컴포넌트 라이브러리는 없다. 아이콘만 `lucide-react`를 쓴다.
2. **디자인 시스템 마이그레이션이 이미 상당히 진행된 상태로 커밋되지 않은 채 남아 있다.** `src/components/ui/`, `globals.css`의 `pp-*` 토큰·레시피, `scripts/ui-check.ts`, `docs/design-system.md`, `decisions/design-system.md`가 있다. 사용자 영역에서 Tailwind 팔레트 색상 클래스는 **4,472개에서 492개로(−89%)**, `dark:` 분기는 **1,841개에서 210개로(−89%)** 줄었다. `npm run ui:check`는 "132 migrated files" 통과(에러 0, 경고 19).
3. 다만 **마이그레이션은 레시피 함수(`buttonStyles()` 등) 위주로 됐고, 공유 React 컴포넌트(`<Button>`, `<Field>`, `<Input>`, `<ModalSurface>` …)는 제품 코드에서 한 번도 쓰이지 않는다.** 클래스 조합 방식(템플릿 리터럴, `+` 연결, `uiClassNames`)도 세 가지가 섞여 있다.
4. **관리자 영역은 의도적으로 제외돼 있어 손대지 않은 상태다.** 팔레트 클래스 3,112개, hex 157개, 임의 px 222개가 남아 있고, 버튼 115개에 서로 다른 className이 90종, 입력 필드 156개에 51종이다.
5. 아직 공통화되지 않은 반복 패턴: **모달/시트 셸**(10곳, Escape 처리는 2곳뿐), **필터 드로어 3종**, **공유 버튼 3종**, **캘린더 2종**, **상태 배지 색상 맵**(최소 6곳), **빈 상태**(19곳), **로딩 스피너**(38곳), **`alert()/confirm()` 기반 피드백**(사용자 59 · 관리자 56곳).
6. **실제로 동작하지 않는 클래스가 있다.** `animate-in`, `fade-in`, `slide-in-from-bottom`, `zoom-in`(플러그인 미설치), `pt-safe`, `pb-safe-bottom`(정의 없음)이 합쳐서 50곳 이상이다.

---

## 1. 사용 중인 스타일링 방식

| 구분 | 현황 |
| --- | --- |
| CSS 프레임워크 | Tailwind CSS v4 (`@tailwindcss/postcss`, `@import "tailwindcss"`), 설정 파일 없이 `@theme inline` 사용 |
| 전역 CSS | `src/app/globals.css` 404줄. 기본 변수(`--background`, `--foreground`, Pretendard 폰트 스택), 스크롤바 유틸, `.pb-safe`, 그리고 **`pp-*` 디자인 토큰·컴포넌트 클래스**(작업 트리에서 추가됨) |
| 디자인 토큰 | `--pp-*` CSS 변수: surface/text/border/accent/status/radius/space/shadow. `@theme inline`으로 `bg-pp-surface`, `text-pp-muted`, `rounded-pp-card` 같은 Tailwind 유틸리티로 노출 |
| 테마 스코프 | `UserThemeScope`가 경로에 따라 `data-ui-theme="powerplay" | "lounge" | "youth"`를 붙여 accent만 교체. admin·instagram은 스코프 밖. 다크 모드는 OS `prefers-color-scheme`를 따름 |
| 컴포넌트 라이브러리 | 없음 (shadcn, Radix, Headless UI 모두 미사용). `src/components/ui/`에 자체 프리미티브 9종 |
| 클래스 유틸 | `uiClassNames()`(단순 join). `clsx`, `tailwind-merge`, `cva` 없음. 그래서 충돌하는 클래스를 해결해 주지 않음 |
| 도메인 테마 객체 | `src/components/lounge-theme.ts`: 라운지 금색과 카테고리별 색을 Tailwind 임의값 문자열로 보관 (hex 145개) |
| 인라인 스타일 | `style={{}}` 사용자 35곳 / 관리자 6곳. 대부분 동적 값(색상 피커, 아바타, OG 이미지)이라 정당함 |
| 아이콘 | `lucide-react` 단일 |
| 폰트 | 시스템 폰트 스택. 변수명은 `--font-pretendard`이지만 Pretendard 웹폰트를 로드하는 곳은 없다. 반면 `seo-bot/[locale]/layout.tsx`만 `next/font/google`로 Geist를 로드해 **봇용 렌더링과 사용자 화면의 폰트가 다르다** |

### 1-1. `src/components/ui/` 프리미티브와 레시피

| 레시피 (제품 코드 사용량) | 컴포넌트 (제품 코드 사용량) |
| --- | --- |
| `buttonStyles()` 182곳 | `Button` / `LinkButton` / `IconButton`: **0** |
| `fieldStyles()` 39곳 | `Input` / `Select` / `Textarea` / `Field`: **0** |
| `surfaceStyles()` 109곳 (42파일) | `Surface`: **0** |
| `badgeStyles()` 43곳 | `Badge`: **0** |
| `filterChipStyles()` 30곳 | `FilterChip`: **0** |
| `segmentedItemStyles()` 27곳 | `SegmentedControl`: **0** |
| `overlayStyles()` 10곳 | `ModalSurface` / `SheetSurface`: **0** |
| `pp-text-title/heading/body/caption` 합계 19곳 | 타이포그래피 컴포넌트 없음 |

컴포넌트는 `/dev/design-system` 갤러리에서만 렌더링된다. `docs/design-system.md`는 "새 컨트롤에는 프리미티브를 우선 쓴다"고 정해 두었으므로 이 규칙과 현재 사용 실태가 어긋나 있다.

---

## 2. 마이그레이션 진행 현황 (HEAD → 작업 트리)

| 지표 | 사용자 HEAD | 사용자 현재 | 관리자 현재 | 내보내기 | SEO 봇 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `@/components/ui` import 파일 | 0 / 132 | **82 / 132** | 1 / 71 | 0 | 0 |
| Tailwind 팔레트 색상 클래스 | 4,472 | **492** | 3,112 | 97 | 132 |
| `dark:` 분기 | 1,841 | **210** | 88 | 0 | 62 |
| hex 리터럴 (tsx만) | 89 | 59 | 157 | 35 | 0 |
| 임의 크기값 `-[Npx]` 등 | 150 | 141 | 222 | 24 | 4 |
| 레시피를 거친 `<button>` | 0 / 209 | **202 / 212** | 9 / 115 | — | — |
| 레시피를 거친 입력 필드 | 0 / 47 | **45 / 50** | 0 / 156 | — | — |

- `docs/design-system-routes.json`: 라우트 72개 중 ordinary 32 / mixed 8 / excluded 32. **ordinary·mixed 40개 모두 `migration: "pending"`, `verification: "pending"`** 상태로, 소스 마이그레이션은 됐지만 문서상 완료 처리와 런타임 검증이 안 됐다.
- `scripts/ui-policy.json`이 파일별로 허용한 색상 예외(라운지 금색, 포인트 앰버, 인스타그램 캔버스, 운세 아트워크 등)를 사유와 함께 기록하고 있다.
- 관리자·SEO 봇·인스타그램 캔버스는 **정책상 제외**(`decisions/design-system.md`). 이 감사 범위에 관리자를 포함할지는 결정이 필요하다 (§7).

---

## 3. 패턴별 불일치

### 3-1. 버튼

- **사용자 영역**: 202/212개가 `buttonStyles()`를 거치지만 같은 레시피를 붙이는 방식이 제각각이다.
  - `` `${buttonStyles({...})} w-full` ``: `fullWidth` 옵션이 있는데도 `w-full`을 덧붙임 (최소 8곳)
  - `buttonStyles({...}) + " inline-flex items-center gap-1"`: `.pp-button`이 이미 `inline-flex; gap: 8px`인데 다시 지정해 덮어씀
  - `uiClassNames(buttonStyles(...), ...)`
  - 고유 className 조합이 212개 중 152종. 레이아웃 클래스가 섞여서 생기는 차이가 대부분이다.
- 레시피를 거치지 않은 버튼: `home-client.tsx`(12개 중 0), `lounge-page-client.tsx`, `language-switcher.tsx`, `date-filter.tsx`, `birth-date-picker.tsx`, `tamagotchi-avatar.tsx`, `global-error.tsx` 등. 대부분 캘린더 셀, 탭, 아바타처럼 특수한 형태라 일부는 예외로 볼 수 있다.
- **관리자 영역**: 115개 버튼에 90종의 className. 같은 "주요 액션"이 `bg-amber-400 … rounded-xl`(10곳), `bg-blue-600 … rounded-lg`, `bg-orange-500/10 border …` 등으로 갈린다. 비활성 버튼도 `cursor-not-allowed` 고정 클래스와 `disabled:opacity-50` 두 방식이 섞여 있다.
- 로딩 상태: `Button`의 `loading` prop은 쓰이지 않고, 각자 `Loader2` + `animate-spin`을 넣는다. 스피너 크기 표기가 `w-4 h-4`, `h-4 w-4`, `w-3.5 h-3.5`, `w-5 h-5`, `w-8 h-8` 등으로 흩어져 있다 (38곳).

### 3-2. 폼 (input / select / textarea / label)

- 사용자 영역은 `fieldStyles()`로 거의 통일됐지만 **`Field`(label·help·error 연결)는 0회 사용**이다. 라벨·도움말·에러 마크업은 각 폼(`onboarding-form`, `profile-editor`, `youth-client`, `youth-write-client`, `charge-form`)이 직접 만든다.
- `fieldStyles({ multiline: true }) + " pp-textarea"`처럼 같은 클래스를 두 번 넣은 곳이 있다.
- 체크박스와 라디오는 공용 스타일이 없다 (`w-4 h-4 text-pp-accent-text focus:ring-pp-accent` 등 개별 지정).
- **관리자 영역**의 입력 스타일은 크게 두 계열이 섞여 있다.
  - `w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100` (30곳)
  - `w-full px-4 py-3 bg-zinc-900|800 border border-zinc-700 rounded-lg … focus:border-blue-500 focus:ring-1` (22곳 이상)
  - radius(`rounded-xl` / `rounded-lg`), 패딩(`px-3 py-2.5` / `px-4 py-3`), 배경(zinc-950/900/800) 3축이 모두 다르다.
- 폼 컴포넌트 자체도 중복이다: `match-form.tsx`(641줄)와 `match-edit-form.tsx`(665줄), `lounge-event-form.tsx`(609줄)와 `lounge-bulk-event-form.tsx`(562줄)는 필드 구성이 거의 같다.

### 3-3. 카드 / 패널

- 사용자 영역은 `surfaceStyles({ interactive, density })`로 정리되는 중이다 (42파일). 다만 카드 내부의 **상단 강조선, 상태 배지, 메타 정보 행**은 카드마다 다르게 구현돼 있다.
  - `match-card.tsx`: 상단 1px 라인 `bg-[#172554] dark:bg-pp-accent`, 시간 `text-[13px]`, 상태 배지 `text-[10px]` 직접 지정
  - `club-card.tsx`, `lounge-card.tsx`, `lounge-event-card.tsx`: 각자 헤더·배지·메타 행 구조가 다름
- 관리자 카드 `admin-match-card.tsx`와 `superuser-match-card.tsx`는 라인 기준 **유사도 71%** (300/315줄)로, 사실상 같은 컴포넌트를 복제한 상태다. `admin-club-card`, `admin-rink-card`도 같은 셸을 반복한다.
- CLAUDE.md·AGENTS.md P7의 "카드 hover는 `border-blue-500` + `shadow-md`" 규칙은 디자인 시스템에서 `--pp-focus` 토큰 기반 hover로 바뀌었다. 라운지 테마에서는 금색이 되므로 **문서끼리 규칙이 어긋나 있다.**

### 3-4. 테이블

- `<table>`은 관리자 영역에만 있다: `admin/audit-logs`, `admin/admins`, `notification-test-panel`, `user-management-tab`, `point-status-tab`. 공통 테이블 스타일은 없고 헤더 셀 패딩, 줄무늬, 모바일 가로 스크롤 처리가 파일마다 다르다.
- 사용자 영역의 목록은 테이블 대신 카드나 행 리스트(`mypage-menu-row`, `participant-list`)를 쓰는데, 행 구분선과 패딩이 각기 다르다.

### 3-5. 모달 / 시트 / 드로어

`fixed inset-0`으로 직접 만든 오버레이가 **사용자 11곳, 관리자 2곳** 있다.

| 파일 | 형태 | 배경 | z-index | Escape | 스크롤 잠금 |
| --- | --- | --- | --- | --- | --- |
| `delete-account-modal.tsx` | 중앙 모달 | `bg-black/50 backdrop-blur-sm` | z-50 | ✗ | ✗ |
| `onboarding-form.tsx` | 중앙 모달 | `bg-black/50` + `animate-in fade-in`(미동작) | z-50 | ✗ | ✗ |
| `notification-guide-modal.tsx` | 중앙 모달 | `bg-black/60` | z-50 | ✗ | ✗ |
| `chat-user-selector.tsx` | 모바일 시트 / 데스크톱 모달 | `bg-black/50` | z-50 | ✗ | ✗ |
| `region-` / `rink-` / `match-type-filter-drawer.tsx` | 하단 시트 | visible/invisible 토글 | z-50 | ✗ | ✗ |
| `tamagotchi-closet.tsx` | 전체 화면 | `bg-pp-surface` | z-50 | ✓ | — |
| `clubs/[id]/card`, `mypage/card` page.client | 전체 화면 | `bg-pp-surface` | z-50 | ✗ | — |
| `admin-profile-modal.tsx` | 중앙 모달 | `bg-black/60` | **z-[100]** | ✓ | — |
| `user-management-tab.tsx` | 중앙 모달 | `bg-black/70` | z-50 | ✗ | — |

- `overlayStyles()`로 겉모습은 맞췄지만 **백드롭 투명도(50/60/70), 닫기 동작, 포커스 트랩, 스크롤 잠금**은 통일되지 않았다. `role="dialog"`는 9곳에만 있다.
- 디자인 시스템 문서가 "Dialog 라이프사이클 교체는 별도 작업"이라고 명시해 두었으므로 그 별도 작업의 1순위 후보다.
- z-index 값: `z-10`(69), `z-50`(25), `z-0`(10), `z-20`(4), `z-40`(2), `z-30`, `z-[70]`, `z-[100]`. 레이어 순서를 정한 스케일이 없다.

### 3-6. 배지 / 상태 표시

- `badgeStyles({ tone })` 43곳으로 톤은 통일됐지만, **도메인 상태를 톤으로 바꾸는 매핑은 파일마다 따로 있다.**
  - `match-card.tsx` `statusColors`, `participant-list.tsx` `statusColors`, `instagram-match-card.tsx` `statusColors`, `my-match-list.tsx`(인라인 green/yellow/red/blue/amber -100/-800 조합), `lounge-application-manager.tsx` `getStatusClass`, `admin/admins/[id]` `getRoleBadge`, `admin/audit-logs` `getActionColor`
  - `match-card`의 상태 배지는 `badgeStyles`를 쓰지 않고 `rounded-full px-2 py-0.5 text-[10px] font-bold border`를 직접 조합한다. 같은 카드 안에서 길이 배지(`badgeStyles`)와 형태가 미묘하게 다르다.

### 3-7. 필터 / 탭 / 세그먼트

- `filterChipStyles` 30곳, `segmentedItemStyles` 27곳으로 겉모습은 정리됐다.
- 필터 드로어 3종(`region-filter-drawer` 143줄, `rink-filter-drawer` 153줄, `match-type-filter-drawer` 139줄)은 **유사도 66~77%**이고 열기/닫기·임시 선택값·초기화·적용 로직이 같다. 선택지 데이터만 다르다.
- `date-filter.tsx`, `calendar-view.tsx`, `lounge-calendar-view.tsx`는 날짜 셀 구현이 각각 있다. 두 캘린더는 둘 다 176줄이고 구조가 같으며, 선택·오늘·이벤트 있음 색만 다르다 (라운지는 `lounge-theme.ts`의 `calendar*` 키 사용).

### 3-8. 간격

- 토큰 문서상 간격 체계는 4/8/12/16/20/24/32px(Tailwind 1/2/3/4/5/6/8)이지만, 실제로는 **0.5 단위 값이 광범위하게 쓰인다.**
  - 사용자: `py-2.5`(21), `px-2.5`(10), `gap-1.5`(38), `py-1.5`, `space-y-1.5`, `px-1.5`(16)
  - 관리자: `py-2.5`(100), `px-2.5`(45), `gap-1.5`(58), `gap-2.5`(26), `p-3.5`(16), `py-3.5`(18), `gap-7`(6)
- 세로 리듬은 `space-y-*`와 `gap-*`가 섞여 있다 (사용자 `space-y-*` 약 150곳, `gap-*` 약 430곳).
- 페이지 컨테이너 폭과 패딩이 페이지마다 다르다.
  - `max-w-2xl`(26), `max-w-md`(16), `max-w-3xl`(10), `max-w-xl`, `max-w-sm`, `max-w-lg`(각 7), `max-w-7xl`(5), `max-w-4xl`(5), `max-w-5xl`(4), `max-w-6xl`(3), `max-w-[420px]`(4), `max-w-[380px]`(2)
  - 같은 형태의 상세 페이지인데 `container mx-auto max-w-2xl px-4`, `max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8`, `mx-auto max-w-3xl space-y-5 py-4 md:py-8`처럼 서로 다르게 지정한다.

### 3-9. 색상

- 사용자 영역에 남은 팔레트 클래스 492개는 대부분 `white`(179), `zinc`(168), `blue`(51)이다. `text-white`는 그라데이션 히어로와 진한 배경 위 텍스트에 많다.
- **토큰과 `dark:` 오버라이드를 같이 쓰는 경우가 27개 파일 45곳**이다. 대표적으로 `text-pp-text dark:text-white`(41곳). `--pp-text`가 이미 다크에서 `#f4f4f5`로 바뀌므로 `dark:` 쪽은 불필요하고, 갤러리의 `data-ui-mode` 강제 모드와도 충돌한다.
- 같은 navy가 `#172554`, `text-pp-navy`, `.pp-button-navy`의 하드코딩 `#172554`/`#1e3a8a`로 세 군데에서 정의된다. 버튼 hover 색(`#b91c1c`, `#15803d`, `#b45309`, `#be185d`, `#d97706`)도 토큰이 아닌 CSS 하드코딩이다.
- 관리자 영역은 `zinc`(1,891), `blue`(351), `amber`(179), `red`(121), **`slate`(96), `gray`(17)** 등 회색 계열 세 가지가 섞여 있다. 관리자 레이아웃은 다크 고정(`bg-zinc-900 text-zinc-100`)이고 브랜드 색 `#F4A261`이 `style={{ color }}`로 박혀 있다.
- 관리자 hex 157개 중 141개는 `card-news-studio.tsx`(인스타 카드뉴스 편집기의 네온 팔레트 `#e8ff00`, `#00ffcc`, `#ff007f`, `#0066ff`)로, 아트워크 성격이 강하다.

### 3-10. 폰트 크기 / 굵기 / 타이포 위계

| | `text-xs` | `text-sm` | `text-base` | `text-lg` | `text-xl` | `text-2xl` | `text-[10px]` | `text-[11px]` | `text-[13px]` | 기타 임의값 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 사용자 | 130 | 247 | 30 | 48 | 31 | 34 | **30** | **17** | 4 | `[8px]`, `[9px]`, `[15px]`, `[0.95rem]`, `[1.05rem]`, `[1.2rem]` … |
| 관리자 | 292 | 412 | 11 | 40 | 20 | 29 | **40** | **62** | 2 | `[7px]`~`[26px]` 13종 |

- 디자인 토큰에 caption(12px)보다 작은 단계가 없어 `text-[10px]`/`text-[11px]`가 사실상 "마이크로 텍스트" 토큰 노릇을 하고 있다. `.pp-badge`도 CSS에서 `11px`를 직접 쓴다.
- 굵기 6단계를 모두 쓴다. 사용자 영역 기준 `bold` 218, `medium` 112, `semibold` 95, `black` 40, `normal` 6, `extrabold` 2.
- 제목 위계가 정해져 있지 않다.
  - `<h1>` 29곳에 굵기·크기 조합 20종 (`font-bold text-2xl`, `font-black text-3xl tracking-tight`, `font-black text-4xl` …)
  - `<h2>` 130곳에 15종 (`font-black` 크기 미지정 35, `font-bold text-lg` 26, `font-bold text-xl` 25 …)
  - `pp-text-title/heading/body/caption` 클래스는 정의돼 있지만 19곳에서만 쓰인다.

### 3-11. Radius / 그림자

- 사용자 영역 radius 분포: `rounded-full` 104, `rounded-lg` 63, `rounded-xl` 55, `rounded-2xl` 34, `rounded`(4px) 34, `rounded-3xl` 8, `rounded-md` 6, 임의값 `[14px]`·`[22px]`·`[24px]`·`[28px]`·`[32px]`·`[36px]` 14곳.
- 규칙은 "카드·필드 12px(`rounded-xl`), 모달 24px"인데 `rounded-lg`(8px)가 여전히 `rounded-xl`보다 많다. 관리자 영역은 `lg` 229, `xl` 195로 거의 반반이다.
- 그림자는 사용자 영역 `shadow-sm` 27, `shadow-lg` 10, `xl`/`2xl`/`md` 10. 토큰(`--pp-shadow-card/hover`)과 별도로 직접 지정한다.

### 3-12. 피드백 · 로딩 · 빈 상태

- **사용자 피드백**: `alert()` / `confirm()`이 사용자 59곳, 관리자 56곳이다 (`youth-client` 8, `notification-guide-modal` 8, `parent-applications-list` 6, `post-detail-client` 5 …). 토스트는 공유 버튼 3종 안에만 각자 구현돼 있고, `match-share-button.tsx`에는 사용되지 않는 `toastMsg` 상태가 남아 있다 (lint 경고).
- **로딩**: 라우트 `loading.tsx`는 0개. `skeletons.tsx`에 7종이 있지만 버튼·섹션 로딩은 `Loader2` 스피너를 개별로 넣는다.
- **빈 상태**: "텍스트 가운데 정렬 + py-8~20 + 회색 배경" 블록이 19개 파일에 있고 패딩(8/10/12), 배경(`zinc-50`/`gray-50`/`zinc-800/50`/`zinc-900/50`), 테두리 유무가 모두 다르다.
- **페이지 헤더**: `MypageSubpageHeader`는 7개 파일에서만 쓰이고, 뒤로가기 화살표(`ArrowLeft`/`ChevronLeft`)를 쓰는 헤더는 16개 파일에서 각자 구현한다.

### 3-13. 동작하지 않는 클래스 (잠재 버그)

| 클래스 | 사용 수 | 원인 |
| --- | ---: | --- |
| `animate-in`, `fade-in`, `slide-in-from-bottom-*`, `zoom-in-*` | 24 / 21 / 6 / 3 | `tailwindcss-animate`(또는 `tw-animate-css`) 미설치. 진입 애니메이션이 실제로는 적용되지 않음 |
| `pt-safe` | 6 | 정의 없음. `globals.css`에는 `.pb-safe`만 있음 |
| `pb-safe-bottom` | 4 | 정의 없음. 전체 화면 카드 페이지의 iOS 하단 safe area 미적용 가능 |

---

## 4. 하드코딩 값 분포

### 4-1. 영역별 총량 (작업 트리)

| 항목 | 사용자 | 관리자 | 내보내기 | SEO 봇 |
| --- | ---: | ---: | ---: | ---: |
| Tailwind 팔레트 색상 클래스 | 492 | 3,112 | 97 | 132 |
| hex 리터럴 (`.ts` 포함) | 240 | 157 | 35 | 0 |
| 임의값 hex 클래스 `x-[#...]` | 191 | 153 | 35 | 0 |
| 임의 크기값 `x-[Npx/rem/%]` | 141 | 222 | 24 | 4 |
| 임의 폰트 크기 `text-[..]` | 약 60 | 약 190 | — | — |
| `style={{}}` | 35 | 6 | 3 | 1 |

### 4-2. 사용자 영역 상위 파일

| 팔레트 색상 클래스 | hex 리터럴 | 임의 크기값 |
| --- | --- | --- |
| `about-page-content.tsx` 71 (SEO 공용 렌더러, legacy 분기 유지) | `lounge-theme.ts` 145 | `clubs/[id]/card/page.client.tsx` 22 |
| `daily-hockey-fortune-screen.tsx` 43 (아트워크 예외) | `lib/tamagotchi-palette.ts` 23 | `daily-hockey-fortune-screen.tsx` 10 |
| `clubs/[id]/card/page.client.tsx` 33 | `app/api/og/route.tsx` 15 (OG 이미지, 정당) | `youth-client.tsx` 8 |
| `my-match-list.tsx` 29 (상태 색 인라인) | `lib/notifications/templates.ts` 13 (이메일, 정당) | `match-card.tsx` 8 |
| `mypage/points/page.tsx` 27 | `lounge-membership/page.tsx` 11 | `lounge-membership/page.tsx` 8 |
| `match-card.tsx` 24 | `feedback-banner.tsx` 8 | `lounge-event-card.tsx` 7 |
| `contexts/chat-unread-context.tsx` 23 | `lounge-contact-menu.tsx` 6 | `match-application.tsx` 6 |
| `mypage/card/page.client.tsx` 23 | `login/page.tsx` 5 (카카오/네이버) | `mypage/card/page.client.tsx` 6 |

`@/components/ui`를 import하지 않으면서 색상을 직접 쓰는 사용자 영역 파일: `contexts/chat-unread-context.tsx`, `lounge-membership/page.tsx`, `feedback-banner.tsx`, `tamagotchi-avatar.tsx`, `find-club-banner.tsx`, `bottom-nav.tsx`, `copy-button.tsx`, `global-error.tsx`, `daily-hockey-fortune-banner.tsx`, `mypage-menu-row.tsx`, `linkified-text.tsx`, `find-club/page.tsx`.

### 4-3. 관리자 영역 상위 파일

| 파일 | 팔레트 | hex | 임의값 |
| --- | ---: | ---: | ---: |
| `card-news-studio.tsx` | 491 | 141 | 154 |
| `match-form.tsx` | 180 | — | 3 |
| `match-edit-form.tsx` | 157 | — | 3 |
| `schedule-pattern-card.tsx` | 148 | — | 8 |
| `lounge-event-form.tsx` | 109 | 1 | — |
| `lounge-notice-manager.tsx` | 100 | 2 | — |
| `lounge-business-form.tsx` | 99 | 1 | — |
| `user-management-tab.tsx` | 96 | — | 4 |
| `lounge-bulk-event-form.tsx` | 91 | — | — |
| `superuser-match-card.tsx` | 83 | — | — |
| `point-status-tab.tsx` | 77 | — | — |

### 4-4. 의도된 하드코딩 (정리 대상이 아님)

- 라운지 금색 `#d4a017` / `#f3d27a` 및 카테고리 색 (`lounge-theme.ts`). 다만 Tailwind 임의값 문자열 대신 CSS 변수로 옮길 수 있다 (§5 B-6).
- 카카오 `#fee500`, 네이버 `#03c75a` 등 외부 브랜드 색
- 인스타그램·카드뉴스·클럽 카드 이미지 내보내기 캔버스 (OS 테마와 무관하게 고정돼야 함)
- 운세·타마고치 아트워크, OG 이미지, 이메일 템플릿

---

## 5. 공통 컴포넌트 후보

### A. 이미 있는 프리미티브의 실사용 전환 (새로 만들 필요 없음)

| # | 후보 | 대상 | 근거 / 효과 |
| --- | --- | --- | --- |
| A-1 | `<Button>` / `<LinkButton>` / `<IconButton>` | `buttonStyles()` 182곳 | 문자열 연결 3방식과 `w-full`/`inline-flex` 덧붙이기 제거. `loading` prop으로 `Loader2` 개별 삽입 대체 |
| A-2 | `<Field>` + `<Input>`/`<Select>`/`<Textarea>` | `onboarding-form`, `profile-editor`, `youth-*`, `charge-form` | label/help/error와 `aria-describedby` 연결을 자동화 |
| A-3 | `<Badge>` | `badgeStyles()` 43곳 + 직접 조합한 상태 배지 | — |
| A-4 | `<FilterChip>`, `<SegmentedControl>` | 각 30·27곳 | 선택 상태 ARIA(`aria-pressed`) 일관화 |

### B. 새로 만들 공통 컴포넌트 (우선순위순)

| # | 후보 | 통합 대상 (현재 구현) | 기대 효과 |
| --- | --- | --- | --- |
| B-1 | **`Dialog` / `Sheet`** (백드롭·Escape·포커스 트랩·스크롤 잠금·`aria-labelledby`) | `delete-account-modal`, `onboarding-form` 모달, `notification-guide-modal`, `chat-user-selector`, 필터 드로어 3종, `admin-profile-modal`, `user-management-tab` 모달 | 동작·접근성 통일. 현재 Escape 지원은 13곳 중 2곳뿐 |
| B-2 | **`FilterDrawer`** (임시 선택값·초기화·적용, 옵션 목록만 주입) | `region-filter-drawer`, `rink-filter-drawer`, `match-type-filter-drawer` (유사도 66~77%) | 약 430줄을 1개 컴포넌트와 설정 3개로 축소 |
| B-3 | **`StatusBadge` + 상태→톤 매핑 모듈** (`src/lib/status-tones.ts` 등) | `match-card`, `participant-list`, `my-match-list`, `instagram-match-card`, `lounge-application-manager`, 관리자 role/action 배지 | 경기·참가·신청 상태 색의 의미를 한곳에서 관리 |
| B-4 | **`Toast` / `useToast`** + **`ConfirmDialog`** | `alert()`/`confirm()` 115곳, 공유 버튼 3종의 개별 토스트 | 네이티브 alert 제거, i18n 문구 일관화, 모바일 PWA 경험 개선 |
| B-5 | **`ShareButton`** (Web Share → 클립보드 → 토스트 fallback) | `club-share-button`, `lounge-share-button`, `match-share-button`, `smart-share` | 공유 로직·토스트 중복 제거 |
| B-6 | **`MonthCalendar`** (셀 렌더러 또는 테마 슬롯 주입) | `calendar-view`, `lounge-calendar-view` (각 176줄, 동일 구조) | 라운지 색을 `data-ui-theme` 토큰으로 처리하면 `lounge-theme.ts`의 `calendar*` 키 제거 가능 |
| B-7 | **`EmptyState`** (아이콘·제목·설명·액션) | 19개 파일 | 패딩·배경·테두리 통일 |
| B-8 | **`Spinner` / `LoadingBlock`** | `Loader2 … animate-spin` 38곳 | 크기 3단계(sm/md/lg)로 고정 |
| B-9 | **`PageContainer`** (폭 `narrow`/`default`/`wide` + 패딩) | `max-w-*` 11종 | 페이지 폭 2~3단계로 정리 |
| B-10 | **`PageHeader` / `SubpageHeader`** (뒤로가기·제목·우측 액션) | `MypageSubpageHeader`(7파일)를 일반화해 뒤로가기를 직접 만든 16개 파일에 적용 | 헤더 높이·여백·타이포 통일 |
| B-11 | **타이포그래피 프리미티브** (`Heading level`, `Text tone/size`) 또는 `pp-text-*` 확장 (+ `micro` 10~11px 단계 추가) | `h1` 20종, `h2` 15종, `text-[10px]`/`[11px]` 47곳 | 제목 위계 고정, 임의 폰트 크기 제거 |
| B-12 | **`CardHeader` / `MetaRow`** (일자·시간·상태 행, 아이콘+라벨 메타) | `match-card`, `club-card`, `lounge-card`, `lounge-event-card` | 카드 내부 구조 통일 |
| B-13 | **`ListRow`** (구분선 리스트 행) | `mypage-menu-row`, `participant-list`, 채팅 리스트 | 행 패딩·구분선 통일 |

### C. 관리자 영역 (범위에 포함할 경우)

| # | 후보 | 대상 |
| --- | --- | --- |
| C-1 | 관리자 다크 테마 스코프 (`data-ui-theme="admin"`)와 기존 레시피 재사용 | 관리자 버튼 90종·입력 51종을 레시피 몇 개로 축소. `slate`/`gray`/`zinc` 혼용 정리 |
| C-2 | `DataTable` (헤더·셀 패딩·모바일 가로 스크롤·빈 행) | `audit-logs`, `admins`, `user-management-tab`, `point-status-tab`, `notification-test-panel` |
| C-3 | `AdminMatchCard` 단일화 (권한별 액션 슬롯) | `admin-match-card` + `superuser-match-card` (유사도 71%) |
| C-4 | 폼 필드 섹션 공통화 | `match-form`/`match-edit-form`, `lounge-event-form`/`lounge-bulk-event-form` |

### D. 토큰 · CSS 정리

- `.pp-button-*` hover 색, `.pp-button-navy`의 하드코딩 hex를 `--pp-*` 토큰으로 옮긴다.
- `text-pp-* dark:*` 중복 45곳을 제거한다 (토큰이 이미 다크 대응).
- 진입 애니메이션 유틸(`animate-in` 등)을 직접 정의하거나 제거하고, `pt-safe`/`pb-safe-bottom` safe-area 유틸을 정의하거나 `pb-safe`로 바꾼다.
- z-index 스케일 토큰을 정한다 (예: base 0 / sticky 10 / header 40 / overlay 50 / toast 60).
- 간격의 0.5 단위 사용을 허용 목록으로 둘지, 토큰 스케일로 강제할지 정한다.
- `lounge-theme.ts`의 hex 문자열을 `[data-ui-theme="lounge"]`나 카테고리별 CSS 변수로 옮긴다.
- CLAUDE.md·AGENTS.md P7의 카드 hover 규칙(`border-blue-500`)을 `docs/design-system.md`에 맞게 갱신한다.

---

## 6. 권장 진행 순서

1. **진행 중인 작업 정리**: 작업 트리의 디자인 시스템 변경(135개 파일)을 단계별 커밋으로 확정하고, `design-system-routes.json`의 pending 40개 라우트를 런타임 검증한다. 새 리팩터링을 이 위에 쌓기 전에 해야 할 일이다.
2. **저위험 정리 (D)**: 동작하지 않는 클래스, `dark:` 중복, 버튼 hover 토큰화. 시각 변화가 거의 없고 회귀 위험이 낮다.
3. **동작 컴포넌트 (B-1 Dialog/Sheet → B-2 FilterDrawer → B-4 Toast/Confirm)**: 접근성과 UX 개선 효과가 가장 크다.
4. **프리미티브 실사용 전환 (A)**: 레시피를 쓰던 곳을 컴포넌트로 바꾸는 기계적 작업이라 파일 단위로 나눠 진행할 수 있다.
5. **레이아웃·타이포 (B-9 ~ B-11)**: 시각 변화가 크므로 `ui:visual` 기준선 갱신과 함께 진행한다.
6. **관리자 영역 (C)**: 범위에 포함하기로 결정한 경우에만.

---

## 7. 결정이 필요한 사항

1. **관리자 영역 포함 여부**: 현재 결정 문서(`decisions/design-system.md`)는 관리자를 제외한다. 하드코딩이 가장 많은 곳이 관리자 영역(팔레트 3,112개)이라, 유지보수성을 목표로 한다면 별도 다크 테마 스코프로 포함하는 것을 검토할 만하다.
2. **프리미티브와 레시피의 역할 분담**: 문서는 "새 컨트롤에는 프리미티브"를 권장하지만 실제 사용은 0이다. 레시피를 기본으로 인정할지, 컴포넌트로 전환할지 정해야 한다.
3. **간격·폰트 크기 엄격도**: 0.5 단위 간격과 10~11px 마이크로 텍스트를 토큰으로 정식 편입할지, 금지할지.
4. **Dialog·Toast 라이브러리 정책**: 결정 문서는 새 의존성을 금지한다. 포커스 트랩을 직접 구현할지(네이티브 `<dialog>` 활용 포함), 예외적으로 작은 라이브러리를 허용할지.

---

## 부록: 재현 방법

- 수치는 `src/**/*.{ts,tsx}`를 정규식으로 스캔해 집계했다 (팔레트 클래스: `(bg|text|border|ring|from|via|to|…)-(zinc|gray|…)-NNN`, 임의값: `-[…px|rem|%]`, 버튼·입력 className은 JSX 태그를 브레이스 깊이로 파싱).
- HEAD 비교는 `git archive HEAD src`로 추출한 사본에 같은 스캔을 돌렸다.
- `npm run ui:check` (2026-10-21): "UI policy passed for 132 migrated files", ESLint 에러 0 / 경고 19 (미사용 변수, `<img>` 사용 등).
- 유사도는 Python `difflib.SequenceMatcher`의 줄 단위 비율이다. 포맷 차이 때문에 실제 구조적 중복보다 낮게 나올 수 있다 (예: `match-form` vs `match-edit-form` 0.33).
