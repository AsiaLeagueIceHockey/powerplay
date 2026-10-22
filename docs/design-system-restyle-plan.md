# 디자인 시스템 리스타일 계획

- 작성일: 2026-10-21
- 방향: `decisions/design-system.md`의 2026-10-21 개정. 차분하고 여백 넉넉한 UI, 중립 회색과 브랜드 컬러 `#2563eb` 하나, 절제된 radius, 최소한의 그림자. 라이트/다크는 OS 설정을 따른다.
- 규칙과 값: `docs/design-system.md` ("Visual direction" 표의 Now/Target). 이 문서는 진행 순서와 완료 조건만 다룬다.
- 범위: 일반 사용자 UI. 관리자(`/admin`), SEO 봇 렌더러, 이미지 내보내기 캔버스는 제외한다.
- 공통 제약: 비즈니스 로직, API 호출, 상태 관리는 바꾸지 않는다. 새 의존성은 사용자 승인 후에만 추가한다.

## 단계 요약

| 단계 | 바꾸는 곳 | 사용자에게 보이는 변화 | 승인 게이트 |
| --- | --- | --- | --- |
| ① 토큰 값 리스타일 | `src/app/globals.css`(토큰과 `pp-*` 클래스)만 | 레시피를 쓰는 컨트롤과 카드의 회색, radius, 그림자, 여백 | 파일럿 화면 전후 스크린샷 |
| ② 빠진 토큰·컴포넌트 | `globals.css`, `src/components/ui/`, 갤러리, 테스트, 문서 | 거의 없음 (새 부품만 추가) | 갤러리 스크린샷과 테스트 |
| ③ 페이지 적용 | 사용자 화면 컴포넌트와 페이지 | 화면별 레이아웃, 타이포, 모달 동작, 남은 하드코딩 정리 | 배치별 스크린샷과 라우트 검증 |

---

## ① 토큰 값 리스타일

컴포넌트 파일은 건드리지 않고 토큰 값과 `pp-*` 클래스만 바꾼다. 레시피를 거치는 버튼, 필드, 카드, 배지, 칩, 오버레이 셸(사용자 영역 버튼 202개, 필드 45개, 카드 recipe 109곳)이 한 번에 바뀐다.

| # | 작업 | 내용 |
| --- | --- | --- |
| 1a | 회색 계열 통일 | 라이트도 다크처럼 zinc 계열로 맞춘다. background `#fafafa`, surface `#ffffff`, surface-muted `#f4f4f5`, border `#e4e4e7`, text `#18181b`, muted `#71717a`. hover용 `--pp-border-strong`을 추가한다 |
| 1b | 액센트 분리 | 모든 스코프에서 `--pp-accent`는 `#2563eb`로 고정한다. Lounge와 Youth는 새 `--pp-section-accent`, `--pp-section-accent-soft`, `--pp-section-accent-text`만 바꾼다. `brand` 배지와 강조선은 section accent를 쓰고, 버튼·칩·포커스 링은 파랑으로 통일된다 |
| 1c | radius | 컨트롤과 카드 8px, 세그먼트 아이템 6px, 모달·시트 12px. 칩·배지는 버튼과 구분되도록 pill을 유지한다 (2026-10-22 결정) |
| 1d | 그림자 | 평상시 카드는 테두리만 둔다. hover는 테두리 색만 바꾼다. 오버레이와 팝오버에만 작은 그림자 하나(`--pp-shadow-overlay`)를 쓴다 |
| 1d' | 다크 카드 구분 | 페이지가 `--pp-surface`를 쓰므로 카드 전용 `--pp-card`(다크 `#222226`)와 `--pp-card-border`(다크 `#34343b`)를 두어 카드를 한 단계 띄운다 (2026-10-22 결정) |
| 1e | 여백 | Surface density를 한 단계씩 넓힌다(compact 12→16, default 16→20, comfortable 20→24, roomy 24→32). 세그먼트와 칩의 좌우 패딩도 조금 늘린다. 컨트롤 높이(36/44/56, 클럽 46)는 유지한다 |
| 1f | 토큰 정리 | `.pp-button-*`의 hover hex와 navy 하드코딩을 `color-mix` 기반 토큰으로 바꾼다 |
| 1g | 검증 갱신 | `scripts/ui-visual.ts`의 기대값(섹션별 accent, background RGB)과 `docs/design-system.md`의 Now 열을 새 값으로 갱신한다 |

**파일럿:** `/ko` 홈(기본 클럽 탭: 헤더, 섹션 탭, 클럽 찾기 배너, 클럽 카드, 하단 내비)을 390px 라이트·다크와 1280px 라이트로 전후 비교한다. `/dev/design-system` 갤러리도 함께 비교한다.

**알려진 한계 (① 단계에서는 정상):**
- 컴포넌트에 직접 적힌 `rounded-2xl`, `shadow-lg`, raw 색상, `lounge-theme.ts`의 금색 hex는 ③ 전까지 그대로 남는다. 그래서 파일럿 화면은 "토큰이 닿는 부분만" 바뀐 중간 상태로 보인다.
- 1b 때문에 라운지와 청소년 화면의 기본 버튼과 선택 칩이 파랑으로 바뀐다. 의도된 변화다.

**상태:** 2026-10-22 사용자 승인, 커밋 완료. 회색 계열과 팔레트는 "팔레트·위계 규칙" 작업에서 다시 정한다.

**완료 조건:** 사용자 승인. `ui:check`, `ui:test`, `ui:visual`, typecheck 통과. 관리자와 내보내기 캔버스의 외형 변화 없음(isolation 테스트). 커밋 1개.

---

## ② 빠진 토큰·컴포넌트

새 부품은 모두 갤러리 예시, 동작 테스트, `docs/design-system.md` 갱신과 함께 추가한다(규칙 9).

| # | 항목 | 내용 |
| --- | --- | --- |
| 2a | 타이포 토큰 | `@theme`에 `text-pp-micro`(11), `caption`(12), `body`(14), `body-lg`(16), `heading`(18), `title`(24), `display`(30)를 line-height와 함께 정의한다. 굵기는 400/500/600/700만 쓴다. `Heading`(level과 size 분리)과 `Text`(tone, size) 프리미티브를 추가한다 |
| 2b | 간격 토큰 | `--pp-page-x`(모바일 16 / 데스크톱 24), `--pp-section-gap`(32 / 40), `--pp-stack-gap`(sm 8, md 12, lg 16)을 정의하고 Tailwind 유틸리티로 노출한다 |
| 2c | `PageContainer` | `width="narrow"`(480) / `"default"`(672) / `"wide"`(1024)와 페이지 좌우·상하 패딩. 지금의 `max-w-*` 11종을 3단계로 정리한다 |
| 2d | `Section` + 섹션 간격 규칙 | 제목, 설명, 우측 액션 슬롯을 둔다. 규칙: 페이지 헤더→첫 섹션 24, 섹션↔섹션 `--pp-section-gap`, 섹션 제목→내용 12~16, 리스트 아이템 사이 `--pp-stack-gap` |
| 2e | `PageHeader` | 뒤로가기(locale 인식 링크), 제목, 설명, 액션. `MypageSubpageHeader`를 일반화한 것이며 기존 컴포넌트는 이것을 감싸는 형태로 남긴다 |
| 2f | `EmptyState` | 아이콘, 제목, 설명, 선택 액션. 현재 19개 파일의 제각각인 빈 상태를 대체한다 |
| 2g | `Dialog` / `Sheet` 동작 | 네이티브 `<dialog>`의 `showModal()`로 배경 inert, Esc 닫기, top-layer를 얻는다. 여기에 포커스 복원, 스크롤 잠금, 백드롭 클릭 닫기, `aria-labelledby`를 더한다. 열림 상태는 계속 소유 컴포넌트가 제어한다. 의존성 추가 없음 |
| 2h | 미사용 클래스 정리 | `animate-in`, `fade-in`, `slide-in-*`, `zoom-in-*`, `pt-safe`, `pb-safe-bottom`을 실제로 동작하는 유틸리티로 정의한다. 진입 애니메이션 2~3종과 safe-area 상·하단 |

**참고:** 처음 요청 목록의 Table은 사용자 영역에 테이블이 없어서(전부 관리자 화면) 이번 범위에서 뺀다. Toast/ConfirmDialog, StatusBadge 매핑, Spinner는 감사 문서(`docs/ui-audit.md` §5)의 후보로 남겨 두고, 필요하면 ③ 중에 별도 승인을 받는다.

**완료 조건:** 갤러리 스크린샷(PowerPlay/Lounge/Youth × ko/en × light/dark × 390/1280), 새 프리미티브 동작 테스트, typecheck와 ui 검사 통과. 항목별 커밋.

---

## ③ 페이지 적용

배치마다 해당 화면의 남은 하드코딩(`rounded-*`, `shadow-*`, raw 색상, `text-[10px]`, `text-pp-* dark:*` 중복)을 토큰과 프리미티브로 바꾸고, 레이아웃을 `PageContainer`·`Section`·`PageHeader`·`EmptyState`로 맞추고, 오버레이를 `Dialog`/`Sheet`로 옮긴다.

| 배치 | 대상 | 비고 |
| --- | --- | --- |
| 1 | 공통 셸: 헤더, 하단 내비, 헤더 메뉴, 섹션 탭, 스켈레톤 | 모든 화면에 보이므로 가장 먼저 |
| 2 | 홈(클럽, 링크장, 경기 탭), 필터 드로어 3종, 캘린더, 날짜 필터 | 드로어를 `Sheet`로 옮긴다. 상태 동기화 로직은 유지하고 `tests/ui/overlay-state-sync.test.tsx`로 회귀를 확인한다 |
| 3 | 클럽 상세, 경기 상세, 링크장 상세, 클럽 찾기 | 클럽 액션 46px 규칙 유지 |
| 4 | 마이페이지(메뉴, 프로필, 포인트, 충전, 내 경기, 알림, 카드 화면 주변 컨트롤) | 충전·계정 삭제 흐름은 실제 제출 없이 확인 |
| 5 | 라운지(목록, 상세, 이벤트, 공지, 브로셔) | `lounge-theme.ts`를 section accent 토큰으로 옮기고, 카테고리 색은 배지와 강조선으로만 쓴다 |
| 6 | 청소년(피드, 글 상세, 글쓰기, 접근 배너) | |
| 7 | 채팅, 온보딩, 로그인·회원가입, About·약관·개인정보, 운세·타마고치 주변 컨트롤 | 아트워크는 제외 |

**배치별 완료 조건:** 전후 스크린샷(ko/en, 390/1280, light/dark), `ui:check`·`ui:test`·`ui:visual`·typecheck 통과, PowerPlay UI final check, `docs/design-system-routes.json`의 migration과 verification 상태 갱신, 배치별 커밋.

---

## 결정이 필요한 항목

| 항목 | 기본안 | 대안 |
| --- | --- | --- |
| 파일럿 이후 반영 방식 | 승인 후 ① 커밋, ②부터 순차 진행 | ①을 피처 플래그로 감싸 일부 화면만 먼저 반영 |
