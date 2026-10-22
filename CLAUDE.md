# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Power Play

아이스하키 동호회 경기 운영·게스트 매칭 플랫폼. Next.js 16(App Router) + React 19 + TypeScript strict + Tailwind v4 + Supabase + `next-intl`(ko/en, locale prefix 항상 사용).

`README.md`는 초기 기획 시점 문서라 코드와 다를 수 있다. 충돌하면 `AGENTS.md`, `.agent/`, 현재 `src/` + `sql/`를 기준으로 삼는다.

## 명령어

| 명령 | 설명 |
|------|------|
| `npm run dev` | `next dev` + `src/app/sw.ts`를 esbuild로 `public/sw.js`에 watch 번들 |
| `npm run build` | `next build` 후 서비스워커를 minify 번들 |
| `npm run typecheck` | `tsc --noEmit`. 커밋 전 필수 (`.githooks/pre-commit`이 TS/Next 시그니처 오류를 차단) |
| `npm run lint` | ESLint |
| `npm test` | `vitest run` (`tests/unit`, `tests/ui`, `src/app/actions/__tests__`) |
| `npx vitest run tests/unit/<file>.test.ts` | 단일 테스트 파일. 케이스만 고르려면 `-t "<이름>"` |
| `npm run ui:test` | UI 관련 테스트 묶음 (home-navigation, i18n-message-keys, find-club 등 지정 파일) |
| `npm run ui:check` / `ui:visual` / `ui:baseline` | 디자인 시스템 점검·시각 회귀·기준선 갱신 (`docs/design-system*.json`) |
| `npm run perf:pwa` | PWA 시작 성능 측정 |

- 프론트엔드·UI·반응형·i18n을 바꾸면 완료 보고·커밋·푸시 전에 `$powerplay-ui-final-check`를 반드시 실행한다 (AGENTS.md의 필수 게이트). 스킬을 쓸 수 없으면 런타임·번역·모바일·콘솔·자동 검사를 수동으로 하고 누락을 보고한다.
- 자동 검사를 통과해도 UI·데이터 플로우는 수동 확인이 필요하다.
- `public/sw.js`는 `next build`가 아닌 별도 esbuild 결과물이다. 서비스워커를 고쳤다면 `dev`/`build` 스크립트를 거쳐야 갱신된다.
- 원래부터 실패하는 테스트 7개는 `docs/known-issues.md`에 있다. "새 실패가 없는지"는 그 목록과 테스트 이름으로 비교한다.

### 검증 안전 규칙: dev 서버로 확인할 때 운영 DB 쓰기 금지

`.env.local`은 운영 Supabase를 가리킨다. dev 서버로 화면을 확인하거나 스크린샷을 찍을 때는 다음을 지킨다.

- DB 연결이 필요 없는 확인은 `/dev/design-system` 갤러리(고정 예시, DB 미연결)를 먼저 쓴다.
- 브라우저 자동화는 **로그인하지 않은 새 세션**으로 하고, `GET`/`HEAD` 외의 요청은 모두 차단한다. 서버 액션, 투표, 트래킹 같은 POST가 나가지 않게 하기 위해서다.
- 서버 렌더링 중 DB에 쓰는 GET 경로는 `docs/known-issues.md` §2에 있다. 로그인 상태로는 이 경로를 열지 않는다.
- 폼 제출, 투표, 참가 신청, 결제·충전, 채팅 읽음 처리처럼 데이터를 바꾸는 동작은 실행하지 않는다. 꼭 필요하면 먼저 사용자에게 묻는다.

## 아키텍처

### 요청 흐름 (`src/middleware.ts`)
한 파일에 여러 관심사가 합쳐져 있다. 순서대로:
1. `/dev/design-system`은 개발 환경에서만 열리고 프로덕션은 404 (로케일·인증 프로바이더 우회).
2. `/` → `/ko` 301.
3. **검색봇 UA**(Yeti, Googlebot 등)는 색인 대상 경로(`/`, `/clubs`, `/rinks`, `/find-club`, `/lounge`, `/about`, `/lounge/*`)를 `/seo-bot/[locale]/...`로 rewrite하고 쿠키·`Set-Cookie`를 제거한다. 공개 레이아웃은 cookies를 읽어 동적 렌더링(`private, no-store`)이 되고, 이러면 네이버 Yeti가 색인하지 않기 때문이다. 이 때문에 공개 페이지의 SEO 대응은 `seo-bot` 쪽에도 반영해야 하는 경우가 있다.
4. 일반 요청: `updateSession`(Supabase 세션 갱신) → `/admin*`(단 `/admin-apply` 제외)은 `checkAdminAccess`로 보호 → next-intl 처리 → Supabase 쿠키를 intl 응답에 병합.
5. matcher는 `api`, 정적 파일, PWA/SEO 파일(sw.js, sitemap, robots 등), 이미지 확장자를 제외한다.

### 라우트 구조 (`src/app/[locale]/`)
- `(public)`: 홈, 클럽, 경기, 링크장, 마이페이지, 채팅, 라운지, 청소년(`youth`/parent) 등 사용자 화면
- `(admin)/admin`: 운영자·슈퍼유저 화면
- `(brochure)`: 라운지 멤버십 소개
- 그 밖에 `instagram/*`(카드뉴스·랭킹용 캡처 화면), `onboarding`, `chat/[roomId]`
- 별도로 `src/app/api/{cron,health,og}`, `src/app/seo-bot`, `src/app/dev`가 있다. 크론은 `api/cron/match-reminder`.

### 데이터 계층
- **쓰기·변경**은 `src/app/actions/*.ts` Server Actions(도메인별 파일: `match`, `clubs`, `lounge`, `points`, `push`, `superuser` 등). 각 액션 안에서 인증·권한을 직접 확인한다. 이 파일들은 `async` 함수만 export할 수 있으므로 동기 헬퍼는 비공개로 두거나 `src/lib/`로 옮긴다 (Next 빌드 오류 방지).
- **도메인 로직**은 `src/lib/*`(예: `public-clubs`, `public-matches`, `lounge-notices`, `club-voting`, `tamagotchi-*`, `notifications/`)에 있고 `tests/unit`이 이를 대상으로 한다.
- **Supabase 클라이언트**는 `src/lib/supabase/{client,server,middleware}.ts` 세 종류. 서버 컴포넌트·액션은 `server`, 브라우저는 `client`, 미들웨어는 `middleware`를 쓴다.
- **알림**: 웹 푸시(`actions/push.ts`, `PUSH_NOTIFICATIONS.md`)와 이메일(`lib/notifications/`, Resend)이 `dispatch.ts`를 통한다.
- **모니터링**: Sentry(`sentry.*.config.ts`, `instrumentation.ts`), `docs/monitoring-runbook.md`, `lib/monitoring`, `api/health`.

### DB 마이그레이션 (`sql/`)
- `sql/v{N}_{설명}.sql`을 순서대로 쌓는 방식이고, 롤백은 `rollback_v*.sql`로 둔다. 현재 최대 번호는 v64.
- v35, v40, v45, v49, v50, v51은 같은 번호의 파일이 둘씩 있다. 새 번호를 정하기 전에 `ls sql`로 최대값을 확인하고 중복을 만들지 않는다.
- RLS와 SECURITY DEFINER RPC가 권한의 핵심이다. 스키마 변경은 `db-migration-writer` 스킬 / `db-architect` 에이전트를 사용한다.

### i18n
- 번역 파일은 `messages/ko.json`, `messages/en.json`이며 키 대칭을 유지해야 한다 (`tests/unit/i18n-message-keys.test.ts`가 검증).
- 공개·사용자 페이지는 ko/en 모두 필수. 슈퍼유저 전용 `/admin` 화면만 한글 하드코딩 허용.

## 도메인 규약 요약

- 날짜·시간 표시는 항상 `timeZone: "Asia/Seoul"`. `datetime-local` 입력은 KST로 간주하고 `new Date(input + "+09:00").toISOString()`으로 UTC 변환해 저장.
- 프로필은 영구 삭제 금지. `profiles.deleted_at`으로 soft delete.
- 역할은 `user` / `admin` / `superuser`.
- 독립적인 데이터 조회는 `Promise.all()`.
- 파일명 `kebab-case`, 컴포넌트 `PascalCase`, `@/*` alias(= `src/*`), `@ts-ignore`·`any` 지양.
- 사용자 대상 문구는 구현·SEO·크롤링을 설명하지 말고 사용자가 찾고, 비교하고, 참여하고, 확인할 수 있는 이점 중심으로 쓴다 (관리자·도구 화면 제외).

## UI 규칙

UI 규칙의 단일 기준은 **`docs/design-system.md`**이다. 일반 사용자 UI를 만들거나 고치기 전에 그 문서의 "Rules at a glance"와 "Visual direction"을 읽는다. 색상·radius·간격 같은 값은 여기에 옮겨 적지 않는다. Codex용 `AGENTS.md`와 `.claude/`·`.agent/` 스킬도 같은 문서를 참조하므로, 규칙이 바뀌면 그 문서만 고친다.

- 공유 계층: 프리미티브는 `@/components/ui`, 레시피는 `@/components/ui/styles`, 토큰은 `src/app/globals.css`의 `--pp-*`에 있다.
- 범위: 관리자(`/admin`), SEO 봇 렌더러, 이미지 내보내기 캔버스는 제외한다.
- 방향 결정과 변경 이력은 `decisions/design-system.md`, 단계별 리스타일 계획은 `docs/design-system-restyle-plan.md`에 있다.
- 검증: `npm run ui:check`, `ui:test`, `ui:visual`을 돌린다. 예외는 `scripts/ui-policy.json`에 사유와 함께 기록한다.

## 하네스: Power Play 통합 개발

**목표:** 아이스하키 동호회 경기 운영 플랫폼(Power Play)의 신기능 개발·개선·QA를 기획→구현→검증→커밋 준비까지 하나의 파이프라인으로 처리한다.

**트리거:**
- Power Play 신기능·개선·버그수정·로드맵(P0/P1) 작업 요청 시 `powerplay-feature-dev` 스킬 사용.
- 코드베이스 감사·회귀 확인·PR 전 최종 체크 등 **QA만 단독**으로 필요할 때는 `powerplay-qa-audit` 스킬 사용.
- 단순 질문(코드 설명, 특정 파일 찾기 등)은 스킬 없이 직접 응답 가능.

**핵심 원칙 (하네스 공통):**
- `powerplay-context` 스킬에 담긴 도메인 규약(KST, soft delete, role=user/admin/superuser, RLS, i18n scope 등)을 작업 전 반드시 확인.
- 도메인 판단(역할 정책, 환경 분류, 피처 우선순위 등)이 애매하면 **추정하지 말고 사용자에게 질문**.
- 중간 산출물은 `_workspace/` 에 쌓이며 git에 올리지 않는다.
- `AGENTS.md` / `.agent/` (Codex용) 는 **참고 자료**. Claude Code는 `.claude/` 하위가 1차 소스.

**참고 자산:**
- 기존 Codex용 가이드: `.agent/skills/*`, `AGENTS.md`, `.agent/implementation/*` — 도메인 지식 참고용.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-24 | 초기 하네스 구성 | 전체 (agents 5, skills 7) | 신규 구축 — 신기능 통합 개발 + QA/회귀 감사 자동화 |
| 2026-10-21 | 명령어·아키텍처·도메인 규약 요약 섹션 추가 | 문서 구조 | `/init` 분석 결과 반영 — 신규 인스턴스 온보딩 속도 개선 |
| 2026-10-21 | "UI 규칙" 섹션 추가, 옛 UI 가드레일(`rounded-xl`·`border-blue-500`) 제거 | CLAUDE.md, code-builder, powerplay-context, nextjs-patterns, boundary-audit | UI 규칙을 `docs/design-system.md` 한 곳으로 일원화 (Codex·Claude 공용) |
| 2026-10-22 | "검증 안전 규칙" 추가, known issue 문서 연결 | CLAUDE.md, docs/known-issues.md | dev 서버가 운영 DB를 가리키므로 검증 중 쓰기 방지 |
