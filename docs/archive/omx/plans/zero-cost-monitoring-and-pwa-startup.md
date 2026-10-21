# PowerPlay 0원 모니터링 및 PWA 초기 진입 최적화 실행 계획

> 상태: 조사·설계 완료, 구현 승인 대기
> 작성일: 2026-09-10 (KST)
> 구현 담당 모델: `gpt-5.6-terra`
> 구현 원칙: 새 유료 서비스·새 런타임 의존성 없이 진행하고, iOS PWA 푸시 실기기 검증 전에는 배포 완료로 간주하지 않는다.

## 1. 목표와 범위

### 목표 A — 0원 모니터링

- 외부 장애, 서버/클라이언트 예외, 핵심 예약 작업 실패를 한 Slack 채널에서 받는다.
- 알림에 환경, 릴리스 SHA, 경로/작업명, 오류 그룹 URL, 원본 스택이 포함되어 나중에 AI 코딩 에이전트가 바로 조사할 수 있게 한다.
- 반복되는 정상 경고와 개인정보는 보내지 않는다.
- 월 고정비 0원과 무료 한도 초과 시 자동 과금되지 않는 구성을 유지한다.

### 목표 B — PWA 초기 진입 속도

- 실제 사용자와 유사한 4G + 4배 CPU 저속 조건에서 `/ko` 첫 진입 중앙값을 다음 기준으로 낮춘다.
  - FCP: 현재 약 3.30초 → **1.8초 이하**
  - LCP: 현재 약 6.21초 → **2.5초 이하**
  - 초기 문서 압축 전송량: 현재 약 83KB(Brotli 브라우저 측정) → **45KB 이하**
  - 초기 JS 전송량: 현재 약 265KB / 15개 청크 → **220KB 이하**, 청크 수 **12개 이하**
  - CDN warm 응답 TTFB: **300ms 이하**
- 실데이터 갱신은 유지한다. 경기/참가자 변경 후 홈의 인원수는 최대 15초 안에 반영되고, 코드가 수행한 변경은 캐시 태그 무효화로 다음 요청부터 반영한다.
- 푸시 구독·백그라운드 수신·알림 클릭 동작을 그대로 유지한다.

### 비범위

- 유료 Vercel 기능, 유료 APM, Redis, 별도 서버 운영
- Supabase 스키마/RPC 신설(1차 최적화에 필요 없음)
- 전체 앱의 모든 페이지 성능 리팩터링
- 서비스 워커 precache 재도입
- 세션 리플레이와 사용자 입력 자동 수집

## 2. 확인된 현재 상태

### 모니터링

| 항목 | 현재 상태 | 근거 |
|---|---|---|
| Sentry SDK | `@sentry/nextjs`가 이미 설치됨 | `package.json:15-17` |
| Sentry DSN | 클라이언트/서버/엣지 파일에 같은 DSN이 하드코딩됨 | `sentry.client.config.ts:1-14`, `sentry.server.config.ts:1-14`, `sentry.edge.config.ts:1-14` |
| 런타임 연결 | `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx`가 없어 Next 16 권장 연결이 완성되지 않음 | 현재 파일 트리 및 Next.js instrumentation 문서 |
| 샘플링 | 세 환경 모두 `tracesSampleRate: 1`이라 실제 연결 시 무료 한도를 빠르게 소모할 위험이 큼 | 각 Sentry config `:7` |
| 오류 수집 | 중요 실패 대부분이 `console.error` 후 정상 반환되어 전역 예외 수집만으로는 보이지 않음 | `src/app/actions/push.ts:43-57,97-109,127-156`, `src/contexts/notification-context.tsx:107-145` |
| 외부 생존 확인 | 전용 health endpoint가 없음 | `src/app/api/` 현재 트리 |
| 예약 작업 | GitHub Actions 5개가 있으나 성공 누락을 감지하는 heartbeat는 없음 | `.github/workflows/*.yml`; 특히 `match-reminder.yml:1-18` |
| Slack | Instagram 계열 workflow는 이미 `SLACK_WEBHOOK_URL`을 참조함 | `.github/workflows/instagram-story.yml:40`, `weekly-matches-story.yml:40`, `club-ranking-story.yml:40` |

### PWA 및 초기 화면

| 항목 | 현재 상태 | 영향/근거 |
|---|---|---|
| 서비스 워커 | install-time precache 비활성, runtime cache만 사용 | `src/app/sw.ts:13-15,72-80` |
| 푸시 회귀 이력 | precache가 iOS의 SW 활성화를 막아 `pushManager.subscribe()`가 실패했던 사건이 문서화됨 | `AGENTS.md:571-598` |
| 푸시 회귀 테스트 | 번들 내 push/click listener와 `precacheEntries: []`를 확인 | `tests/unit/service-worker-build.test.ts:6-30` |
| 시작 URL | manifest가 `/`로 시작하여 `/ko` 301을 한 번 더 거침 | `public/manifest.json:1-8`, `src/middleware.ts:53-62` |
| 라우트 캐시 | `/[locale]`가 production build에서 동적(`ƒ`)으로 판정됨 | 2026-09-10 `npm run build` 결과 |
| 미들웨어 | 모든 일반 사용자 요청에서 Supabase `auth.getUser()` 네트워크 검증을 선행 | `src/middleware.ts:86-111`, `src/lib/supabase/middleware.ts:4-36` |
| 중복 인증 | header, onboarding, notification, chat이 각각 사용자 확인을 수행 | `src/components/user-header-loader.tsx:4-19`, `onboarding-guard.tsx:31-52`, `notification-context.tsx:88-145`, `chat-unread-context.tsx:129-173` |
| 홈 데이터 | 경기 탭만 강제하면서 경기·링크장·동호회를 모두 조회하고 클라이언트로 전달 | `src/app/[locale]/(public)/page.tsx:45-61` |
| 과거 데이터 | 주석과 달리 `getCachedMatches()`에 미래 시간 필터가 없어 취소 외 모든 과거 경기를 직렬화 | `src/app/actions/cache.ts:136-167` |
| 실제 캐시 | 함수명이 `getCached*`지만 cookie 기반 Supabase 때문에 `unstable_cache`를 쓰지 못함 | `src/app/actions/cache.ts:21-26,142-143` |
| 홈 JS | `forcedTab="match"`인데도 rink/club/vote/calendar 코드가 같은 client component에 정적 import됨 | `src/components/home-client.tsx:3-20,307-562` |
| 원격 폰트 | CSS 최상단 `@import`로 jsDelivr Pretendard CSS가 render path에 들어옴 | `src/app/globals.css:1-3` |
| 불필요 폰트 | body는 Pretendard를 쓰지만 Geist Sans/Mono 두 파일을 preload | `src/app/[locale]/layout.tsx:5,19-27,132-135`, `globals.css:26-30` |
| 로고 | 146×50 표시에 2048×698 JPEG(약 200KB)를 쓰고, light/dark 모두 `priority` | `src/components/brand-logo.tsx:13-29`; `public/long-logo.jpg` 실측 200,426B |
| 이미지 최적화 | Vercel 비용 방지를 위해 전역 `unoptimized: true` | `next.config.ts:12-24` |
| 링크 prefetch | 화면에 보이는 고정 nav 및 반복 match/club link가 초기 hydration 후 다수의 RSC 요청을 발생 | `src/components/bottom-nav.tsx:129-170`, `match-card.tsx:51-61,103-108,176-195` |

### 실서비스 기준선(2026-09-10 KST)

- 최초 curl: `Cache-Control: private, no-cache, no-store`, `x-vercel-cache: MISS`, TTFB 1.182초, 총 2.025초, HTML 888,018B.
- 압축 curl 재측정: HTML 110,233B, 총 0.858초.
- Chromium 브라우저 문서 측정: encoded body 83,276B, decoded 888,018B.
- HTML 안의 가장 큰 RSC inline script는 `HomeClient`의 `matches` props로 시작하며 약 647,309자였다.
- 기본 네트워크: FCP 768ms, DOMContentLoaded 1,117ms, 초기 JS 15개/265,071B, 전체 약 726KB.
- 4G(약 1.6Mbps) + CPU 4배 저속: FCP 3,304ms, LCP 6,212ms, DOMContentLoaded 3,709ms, load 5,864ms.
- 저속 waterfall에서 render 전에 두 Geist font(약 23KB/29KB), CSS, 원격 Pretendard CSS가 순차적으로 경쟁했고, light/dark logo가 둘 다 preload되었다.

## 3. 권고 아키텍처

### 3.1 모니터링: Better Stack 무료 단일 스택

권고 구성은 **Better Stack Free + 기존 Sentry SDK + 기존 GitHub Actions + Slack**이다.

```text
브라우저 오류/Web Vitals ──(비동기 JS tag, 최소 수집)──┐
서버·엣지 예외 ──(@sentry/nextjs, 5% trace)───────────┼─> Better Stack
/api/health·/ko·/sw.js ──(3분 외부 monitor)──────────┤      │
GitHub Actions ──(성공 heartbeat)────────────────────┘      └─> #powerplay-alerts
```

선정 이유:

- 공식 무료 플랜은 개인 프로젝트에 월 $0, monitor/heartbeat 10개, Slack/e-mail alert, 월 100,000 exceptions, 3GB logs/traces/web events를 명시한다.
- Sentry SDK 호환이므로 이미 설치된 `@sentry/nextjs`를 재사용할 수 있다.
- 오류 상세에 AI용 prompt와 release/stack context를 제공해 사용자가 Slack 알림을 AI 에이전트에 전달하는 운영 방식과 맞는다.
- Slack 오류 알림과 uptime incident를 같은 서비스에서 처리해 전달 경로가 단순하다.

중요 조건:

- 무료 문구가 “personal projects” 기준이므로 PowerPlay의 이용 형태가 이 조건을 충족하는지 계정 생성 시 약관을 확인한다.
- 초과 자동 과금이 가능한 결제수단을 연결하지 않고, 80% quota 알림을 켠다.
- replay, console log, form/click autocapture, fingerprint를 **코드 배포 전에 먼저 끈다**. Better Stack JS tag의 기본 수집 옵션은 넓게 켜져 있다.

공식 근거:

- 가격/무료 한도: https://betterstack.com/pricing
- Sentry SDK 호환: https://betterstack.com/docs/errors/collecting-errors/sentry-sdk/
- Slack 오류 알림: https://betterstack.com/docs/errors/integrations/slack/
- Web Vitals: https://betterstack.com/docs/rum/using-the-product/web-vitals/
- Uptime 3분 무료: https://betterstack.com/uptime
- AI prompt/MCP 개요: https://betterstack.com/docs/errors/start/

### 3.2 PWA: 서비스 워커가 아닌 origin/render path 우선 최적화

```text
/ko 요청
  ├─ middleware exact-home fast path (Supabase 인증 호출 없음)
  ├─ ISR public shell (cookie·개인정보 없음)
  │    ├─ cached public matches (미래 경기만)
  │    └─ cached home banners (필요 필드만)
  └─ 첫 paint 이후 ViewerProvider 1회 인증
       ├─ header
       ├─ onboarding
       ├─ notification repair
       └─ chat unread/realtime

기존 SW
  ├─ precacheEntries: [] 유지
  ├─ runtime NetworkFirst 유지
  └─ push / notificationclick 유지
```

이 접근은 첫 방문에는 동작하지 않는 SW 캐시에 기대지 않고, 모든 환경에서 전달량과 서버 대기를 줄인다. 기존 runtime cache는 반복 진입의 fallback으로만 유지한다.

## 4. 대안 검토

### 모니터링 대안

| 대안 | 장점 | 단점 | 판정 |
|---|---|---|---|
| Better Stack Free 단일 스택 | 3분 uptime, Slack, errors, Web Vitals, AI prompt를 한곳에 제공 | personal-project 조건 및 외부 서비스 의존 | **권고** |
| 기존 Sentry Free + 별도 uptime | 기존 계정 유지 | Sentry 무료 Slack 가용성이 불명확하고 운영 화면이 분리됨 | 보조 대안 |
| GitHub Actions + Slack webhook만 | 외부 APM 계정 최소화 | 5분 cron은 private repo 무료 분을 초과하기 쉽고 앱 stack/affected-user 정보가 없음 | 비권고 |
| Uptime Kuma self-host | 오픈소스 | 0원이라도 항상 켜진 서버와 운영 책임이 필요 | 비권고 |

### PWA 대안

| 대안 | 장점 | 단점 | 판정 |
|---|---|---|---|
| public ISR shell + 후행 viewer hydration | 첫 화면의 CDN 캐시 가능, 사용자별 정보 누출 없음 | header가 짧게 skeleton으로 보임 | **권고** |
| SW precache 복구 | 반복/오프라인 진입이 빠름 | 이미 iOS push activation 장애를 일으킨 동일 패턴 | 금지 |
| 현재 동적 SSR 유지 + 쿼리만 축소 | 구현이 작음 | middleware/auth cold latency와 no-store가 남음 | 1차 안전 단계로만 사용 |
| 전체 앱 CSR 전환 | 정적 shell 가능 | SEO, 데이터 waterfall, JS 증가 | 비권고 |

## 5. 구현 순서 — GPT-5.6 Terra용 체크리스트

각 단계는 별도 Lore commit으로 유지한다. 이전 단계 검증이 실패하면 다음 단계로 넘어가지 않는다.

### Phase 0 — 기준선과 회귀 가드 고정

#### 0.1 작업 브랜치와 오염 확인

1. `git status --short`가 깨끗한지 확인한다.
2. 브랜치 `codex/zero-cost-monitoring-pwa-startup`을 만든다.
3. 환경 변수의 **이름만** 확인하고 값은 로그에 출력하지 않는다.
4. `public/sw.js`는 빌드 산출물이며 git 추적 대상이 아니므로 직접 편집/커밋하지 않는다.

#### 0.2 재현 가능한 성능 측정 스크립트 추가

대상:

- 신규 `scripts/measure-pwa-startup.ts`
- `package.json`
- 신규 `docs/performance-baseline.md`

세부 사양:

1. 기존 Playwright와 `tsx`만 사용한다. 새 패키지를 설치하지 않는다.
2. `PERF_URL` 기본값은 `https://powerplay.kr/ko`, 로컬 사용 시 명시적으로 덮어쓴다.
3. cold mode는 매 실행마다 새 browser context를 사용해 HTTP cache, cookie, SW를 비운다.
4. warm-PWA mode는 같은 context에서 첫 방문 → SW active 확인 → 두 번째 navigation을 수행한다.
5. CDP로 latency 150ms, download 200,000B/s, upload 93,750B/s, CPU 4배 throttle을 적용한다.
6. 각 모드 5회 측정 후 median을 출력한다.
7. JSON 결과에 다음을 남긴다: TTFB, FCP, LCP, DOMContentLoaded, load, document encoded/decoded bytes, total transfer, JS transfer/count, request count, failed requests, `/sw.js` registration state.
8. `--assert`에서 목표 예산을 초과하면 exit 1을 반환한다.
9. `package.json`에 `perf:pwa` 스크립트를 추가한다.
10. 기준선 문서에 위 2026-09-10 측정값과 측정 조건을 고정한다.

#### 0.3 SW 테스트 강화

대상: `tests/unit/service-worker-build.test.ts`

추가 assertion:

- source가 정확히 `precacheEntries: []`를 포함한다.
- `precacheEntries: self.__SW_MANIFEST`와 `precacheEntries: self.__SW_MANIFEST ?? []`를 포함하지 않는다.
- minified bundle이 `push`, `notificationclick` listener를 포함한다.
- start-page cache 이름과 `NetworkFirst` 1초 timeout이 유지된다.
- manifest 시작 경로가 worker의 `localeStartPath`에 매칭되는지 별도 pure test로 확인한다.

검증:

```bash
npm run test -- tests/unit/service-worker-build.test.ts
npm run perf:pwa
```

### Phase 1 — 0원 모니터링 연결

#### 1.1 사용자/서비스 UI 설정(코드보다 먼저)

사용자가 수행할 1회 설정:

1. Better Stack Free workspace를 만들고 `powerplay-production` Next.js Errors application을 생성한다.
2. `#powerplay-alerts` 전용 Slack 채널을 만들고 Better Stack Slack integration을 연결한다.
3. Errors application의 Frontend 수집 설정을 아래처럼 바꾼 뒤에만 token을 배포한다.
   - frontend errors: ON
   - web vitals: ON
   - error sampling: 100%
   - web-event sampling: 10%
   - session replay: OFF
   - console logs: OFF
   - website analytics: OFF (`@vercel/analytics`와 중복 방지)
   - anonymous/identified autocapture: OFF
   - browser fingerprint: OFF
4. 오류 알림은 production의 `new`, `reoccurred`, `spike`만 Slack으로 보낸다. 동일 그룹 threshold는 5분 10회로 시작한다.
5. quota 80% 알림을 Slack/e-mail로 켠다.
6. 결제수단 및 유료 responder/AI SRE 옵션은 연결하지 않는다.

Vercel Production/Preview에 추가할 변수:

```text
BETTER_STACK_SENTRY_DSN                 # server/edge 전용, secret 취급
NEXT_PUBLIC_BETTER_STACK_SENTRY_DSN     # browser DSN; DSN 자체는 공개 식별자
NEXT_PUBLIC_BETTER_STACK_RUM_TOKEN      # JS tag application token
SENTRY_ORG
SENTRY_PROJECT
SENTRY_URL                              # Better Stack source-map endpoint
SENTRY_AUTH_TOKEN                       # source-map upload용, 절대 client 노출 금지
```

기존 하드코딩 Sentry DSN을 fallback으로 남기지 않는다. 변수가 없으면 monitoring은 조용히 disable되고 앱 기능은 정상 동작해야 한다.

#### 1.2 server/edge error tracking 완성

대상:

- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- 삭제 `sentry.client.config.ts`
- 신규 `src/instrumentation.ts`
- 신규 `src/lib/monitoring/server.ts`
- `next.config.ts`

구현 규칙:

1. server와 edge init은 `BETTER_STACK_SENTRY_DSN`만 읽는다.
2. `enabled`는 DSN이 있고 `NODE_ENV === "production"`일 때만 true로 한다. Preview 검증이 필요하면 `MONITORING_ENABLED=true`의 명시적 opt-in을 허용한다.
3. `environment`는 `VERCEL_ENV ?? NODE_ENV`, `release`는 `VERCEL_GIT_COMMIT_SHA`를 쓴다.
4. `sendDefaultPii: false`, `tracesSampleRate: 0.05`로 시작한다.
5. `consoleLoggingIntegration`은 제거한다. 기존의 많은 `console.warn/error`를 전부 예외로 보내면 quota와 alert 품질이 악화된다.
6. `src/instrumentation.ts`의 `register()`는 `NEXT_RUNTIME`에 따라 server/edge config를 dynamic import한다.
7. `onRequestError`는 `Sentry.captureRequestError`로 연결한다.
8. `next.config.ts`의 하드코딩 org/project를 환경 변수 기반으로 바꾸고 `url`, `authToken`을 Better Stack source-map endpoint로 전달한다. token이 없을 때 build는 실패하지 않아야 한다.
9. source map은 공개하지 않고 upload 후 산출물에서 숨긴다.
10. `src/lib/monitoring/server.ts`는 `captureOperationalError(error, {domain, operation, tags, extra})` 한 함수만 제공한다. endpoint, VAPID key, cookie, auth header, phone, birth date, e-mail을 `extra`로 받지 못하도록 호출부에서 명시적으로 whitelist한다.

#### 1.3 client monitoring은 초기 bundle 밖으로 분리

대상:

- 신규 `src/components/monitoring-runtime.tsx`
- 신규 `src/lib/monitoring/client.ts`
- 신규 `src/app/global-error.tsx`
- `src/app/[locale]/layout.tsx`

구현 규칙:

1. Better Stack 공식 queue snippet은 `next/script`의 `lazyOnload`로 로드해 first paint와 경쟁하지 않게 한다.
2. release/environment를 snippet init에 전달한다.
3. `src/lib/monitoring/client.ts`의 `captureClientOperationalError()`는 `@sentry/nextjs`를 **dynamic import**하고 최초 오류가 발생했을 때만 init/capture한다. `src/instrumentation-client.ts`에서 SDK를 eager import하지 않는다.
4. `global-error.tsx`는 complete `<html><body>` 문서를 렌더하고, `useEffect`에서 위 lazy reporter를 호출한다.
5. Monitoring script/token이 없어도 화면과 push가 동작하도록 모든 reporter는 fail-open으로 구현한다.
6. RUM script 추가 전후 cold 5회 중앙값 LCP 차이가 100ms를 넘으면 tag를 제거하고 server/errors + synthetic uptime만 유지한다.

#### 1.4 반드시 명시적으로 보고할 handled errors

대상과 tag:

- `src/app/actions/push.ts`: `domain=push`, `operation=send|save-subscription|log-notification`; push endpoint는 host family만 남기고 tokenized URL은 저장하지 않는다.
- `src/components/push-manager.tsx`: `domain=push-client`, `operation=register|subscribe`.
- `src/contexts/notification-context.tsx`: `domain=push-client`, `operation=self-repair`.
- `src/components/notification-guide-modal.tsx`: `domain=push-client`, `operation=guide-subscribe`.
- `src/app/api/cron/match-reminder/route.ts`: `domain=cron`, `operation=match-reminder`.
- `src/app/actions/match.ts`: `domain=match`, `operation=join|cancel|waitlist-promote` 중 DB/financial consistency를 깨는 실패만.
- `src/app/actions/superuser.ts`: `domain=points`, `operation=confirm-payment|reject-payment` 중 rollback 또는 transaction 실패만.

사용자 입력 오류, 인증 필요, 정원 마감, 포인트 부족과 같은 정상 domain result는 exception으로 보내지 않는다.

#### 1.5 health endpoint

대상:

- 신규 `src/app/api/health/route.ts`
- 신규 `tests/unit/health-route.test.ts`

응답 계약:

```json
{
  "status": "ok",
  "version": "<VERCEL_GIT_COMMIT_SHA or local>",
  "timestamp": "<ISO8601>",
  "checks": { "app": "ok", "database": "ok" },
  "durationMs": 123
}
```

구현 규칙:

1. cookie-free anon Supabase client로 공개 `rinks`에서 `id` 하나만 조회한다.
2. 2초 timeout을 두며 성공 시 200, DB/env/timeout 실패 시 503을 반환한다.
3. `Cache-Control: no-store`, `X-Robots-Tag: noindex`를 설정한다.
4. 응답에 Supabase URL/key, SQL error detail, stack, 사용자 정보를 넣지 않는다.
5. test는 200, 503, timeout, secret 비노출을 모두 확인한다.

#### 1.6 Better Stack monitors와 heartbeat

무료 슬롯 사용 계획:

| 종류 | 대상 | 조건 | 주기/유예 |
|---|---|---|---|
| monitor 1 | `https://powerplay.kr/api/health` | 200 + `"status":"ok"` | 3분, 2회 연속 실패 후 incident |
| monitor 2 | `https://powerplay.kr/ko` | 200 + `PowerPlay` keyword | 3분, response >2.5초 3회 시 degraded alert |
| monitor 3 | `https://powerplay.kr/sw.js` | 200 + `addEventListener("push"` keyword | 3분, 2회 연속 실패 |
| heartbeat 1 | match reminder | workflow 성공 ping | 매일, 예정 시각 + 2시간 grace |
| heartbeat 2 | lounge aggregation | workflow 성공 ping | 매일, +2시간 grace |
| heartbeat 3 | Instagram daily | workflow 성공 ping | 매일, +3시간 grace |
| heartbeat 4 | weekly matches | workflow 성공 ping | 매주, +6시간 grace |
| heartbeat 5 | club ranking | workflow 성공 ping | 매월, +24시간 grace |

각 workflow 마지막에 `if: ${{ success() }}` heartbeat curl만 추가한다. heartbeat URL은 GitHub Actions secret으로 저장하고 저장소/로그에 원문을 남기지 않는다. 실패 시 ping하지 않아 “job이 아예 실행되지 않음”과 “실행 후 실패”를 모두 missing-heartbeat로 감지한다.

#### 1.7 운영 문서

신규 `docs/monitoring-runbook.md`에 다음을 고정한다.

Slack → AI 전달 템플릿:

```text
[PowerPlay 장애 조사]
- Better Stack 오류/incident URL:
- 발생 KST:
- environment / release SHA:
- route 또는 operation tag:
- first seen / last seen / count / affected users:
- Slack 원문:
- Better Stack AI prompt:
- 최근 배포 또는 재현 조건:

먼저 원인을 재현·진단하고, 관련 없는 코드는 바꾸지 말 것.
수정 후 typecheck/lint/test/build와 해당 domain 회귀 테스트를 실행할 것.
PWA/SW 관련이면 iOS 실기기 push gate 전에는 완료 처리하지 말 것.
```

문서에는 acknowledge, resolve, false-positive ignore, rollback, quota 80% 대응 절차와 민감정보 금지 목록도 포함한다.

#### 1.8 모니터링 검증

1. unit/type/lint/build 통과.
2. Preview에서 의도적 test exception 1건을 보내고 Better Stack에 source-mapped `.tsx` 라인이 보이는지 확인.
3. Slack “Send test alert”가 `#powerplay-alerts`에 도착하는지 확인.
4. `/api/health` monitor가 Asia region에서 green인지 확인.
5. heartbeat 하나를 `workflow_dispatch`로 실행해 수신 시간을 확인.
6. 24시간 관찰 후 alert가 20건/일을 넘으면 정상 domain error를 filter하거나 grouping을 조정한다.

### Phase 2 — render-blocking 자원 제거(낮은 위험)

#### 2.1 폰트 정리

대상:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/seo-bot/[locale]/layout.tsx`

세부:

1. jsDelivr Pretendard `@import`를 제거한다.
2. body는 기존 fallback에 이미 있는 `-apple-system`, `BlinkMacSystemFont`, `system-ui`, `Apple SD Gothic Neo`, `Noto Sans KR`, `Malgun Gothic` 순의 system stack을 사용한다.
3. 실제 body에서 사용하지 않는 Geist와 Geist Mono import/instance/variable class를 모두 제거한다.
4. `--font-mono`는 `ui-monospace, SFMono-Regular, Menlo, monospace`로 정의한다.
5. 화면별 폰트 굵기/줄바꿈 스냅샷을 모바일 390px, 데스크톱 1280px, ko/en에서 비교한다.

수용 기준:

- `/ko` waterfall에 `fonts.googleapis.com`, jsDelivr Pretendard, Geist `.woff2` 요청이 0건.
- 텍스트 CLS 0.02 이하.

#### 2.2 header/PWA icon 최적화

대상:

- 신규 `public/brand/header-light.webp`, `header-dark.webp`
- 신규 `public/icons/icon-192.png`, `icon-512.png`, `favicon-64.png`
- `src/components/brand-logo.tsx`
- `src/app/[locale]/layout.tsx` metadata icons
- `public/manifest.json`
- 필요 시 생성용 `scripts/optimize-static-assets.ts`

세부:

1. 이미 설치된 `sharp`로 원본을 2x 표시 크기(약 292×100)로 resize하고 WebP quality 82로 만든다.
2. header는 native `<picture>`의 dark media source를 사용해 현재 theme에 필요한 한 파일만 다운로드한다. 두 `next/image priority`를 그대로 두지 않는다.
3. manifest icon은 파일의 실제 MIME/type과 dimensions를 일치시킨다. 현재 `favicon.png`는 실제 JPEG 1024×1024이므로 그대로 재사용하지 않는다.
4. OG 및 기존 마케팅 캡처가 원본 로고를 참조하는 부분은 이 단계에서 바꾸지 않는다.

수용 기준:

- header active logo 한 파일만 요청되고 15KB 이하.
- manifest 192 icon 30KB 이하, 512 icon 80KB 이하, favicon 20KB 이하.
- light/dark에서 로고 시각 품질과 종횡비 유지.

#### 2.3 링크 prefetch 폭주 방지

대상:

- `src/components/match-card.tsx`
- `src/components/bottom-nav.tsx`
- `src/components/public-section-tabs.tsx`
- 새 match-only client의 반복 Link

세부:

1. 반복 MatchCard 내부의 match/club Link에는 `prefetch={false}`를 둔다.
2. 첫 화면의 고정 nav Link도 `prefetch={false}`로 시작한다.
3. 클릭은 기존 `router.push`/Link로 동일하게 동작한다.
4. 사용자 의도 기반 prefetch를 추가하고 싶다면 pointer/focus 시 하나만 수행하되 1차 목표에는 넣지 않는다.

수용 기준:

- 사용자가 아무 행동을 하지 않은 첫 5초 동안 match detail/club detail RSC prefetch가 0건.
- nav/match/club 클릭 회귀 없음.

### Phase 3 — 홈 payload와 bundle 분리(중간 위험)

#### 3.1 공개 경기 fetcher 신설

대상:

- 신규 `src/lib/public-matches.ts`
- 신규 `tests/unit/public-matches.test.ts`
- 단계 완료 후 홈에서 `src/app/actions/cache.ts:getCachedMatches` 사용 중단

세부:

1. `src/lib/public-rinks.ts:23-28`과 같은 cookie-free Supabase client 패턴을 사용한다.
2. match query는 `MatchCard`에 필요한 필드만 select한다.
3. `.neq("status", "canceled")`, `.gte("start_time", new Date().toISOString())`, ascending order를 적용한다.
4. participant query는 반환된 match ID에 대해서만 `match_id, position`을 가져오고 `status="confirmed"`만 count한다. 현재 public count 규칙 `src/app/actions/cache.ts:179-197`을 바꾸지 않는다.
5. 결과 mapping/participant aggregation을 pure function으로 분리해 빈 목록, 알 수 없는 position, null rink/club을 unit test한다.
6. `unstable_cache` key `public-home-matches-v1`, `revalidate: 15`, tags `['matches']`를 사용한다.
7. fetch 실패는 빈 배열만 반환하지 말고 monitoring에 `domain=public-data`, `operation=matches`를 기록한 뒤 기존 UI fallback을 유지한다.

#### 3.2 공개 홈 배너 fetcher 신설

대상:

- 신규 `src/lib/public-home-banners.ts`
- `src/components/feedback-banner.tsx`
- `src/app/actions/lounge.ts`의 관련 invalidation

세부:

1. cookie-free anon client와 RLS를 사용한다.
2. `lounge_businesses`에서 banner가 쓰는 필드만 select하고 `is_published=true`, `home_banner_enabled=true`로 제한한다.
3. title/description null/blank filtering과 order/name sort를 server에서 수행한다.
4. `unstable_cache`, `revalidate: 600`, tag `lounge`를 사용한다.
5. `revalidateLoungePaths()`에서 `revalidateTag('lounge', 'max')`도 호출해 관리자 변경 직후 무효화한다.

#### 3.3 MatchHomeClient 분리

대상:

- 신규 `src/components/match-home-client.tsx`
- `src/app/[locale]/(public)/page.tsx`
- 기존 `src/components/home-client.tsx`는 clubs page용으로 보존하고 이번 단계에서 전면 리팩터링하지 않는다.

세부:

1. 기존 `HomeClient`에서 match branch에 필요한 state/UI만 이동한다: date, list/calendar, rink IDs, match types, skater/goalie/rental filter.
2. `RinkExplorer`, `ClubCard`, club vote, region filter imports/state/JS를 포함하지 않는다.
3. rink filter 목록은 `matches[].rink`를 `id` 기준으로 dedupe해 만든다. 별도 `getCachedRinks()` 호출을 제거한다.
4. `CalendarView`는 `next/dynamic`으로 분리하고 사용자가 calendar 버튼을 누를 때만 청크를 로드한다. loading fallback은 기존 skeleton 스타일을 재사용한다.
5. `initialDate`는 page server `searchParams`가 아니라 client `useSearchParams().get('date')`에서 초기화한다.
6. page `HomeContent`는 `getPublicHomeMatches()` 한 개만 기다리고 `MatchHomeClient matches={...}`만 전달한다.
7. page의 `getCachedRinks/getCachedClubs` import와 props를 제거한다.

#### 3.4 match cache invalidation 보강

대상:

- 신규 또는 기존 shared helper `src/lib/cache-invalidation.ts`
- `src/app/actions/admin.ts`
- `src/app/actions/match.ts`
- `src/app/actions/superuser.ts`

`revalidateTag('matches', 'max')`를 성공한 mutation 뒤 정확히 한 번 호출해야 하는 경로:

- create/update/delete/bulk match: `admin.ts:115,255,606,699`
- join/cancel/waitlist apply/promote: `match.ts:203,428,646` 및 participant insert/update/delete 성공 경로
- pending payment confirm/cancel 및 participant 상태 변경: `superuser.ts`의 `participants` mutation 경로 `:357-420,629-709`

DB mutation이 실패한 경로에서는 invalidate하지 않는다. 금전 transaction rollback보다 먼저 invalidate하지 않는다.

수용 기준:

- 빈 cache에서 Supabase 2-query, warm cache에서 Supabase query 0회.
- 과거 match가 serialized props에 존재하지 않음.
- 홈 HTML decoded 300KB 이하, browser encoded 45KB 이하.
- 홈 route-specific JS 220KB 이하, club/rink modules가 home client manifest에 없음.
- join/cancel 후 다음 홈 refresh에서 count 반영, TTL만 기다리는 경우에도 15초 초과 금지.

### Phase 4 — 홈을 개인정보 없는 ISR shell로 전환(높은 효과, 신중 적용)

#### 4.1 ViewerProvider로 중복 인증 합치기

대상:

- 신규 `src/contexts/viewer-context.tsx`
- 신규 `src/components/user-header-client.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/(public)/layout.tsx`
- `src/components/onboarding-guard.tsx`
- `src/contexts/notification-context.tsx`
- `src/contexts/chat-unread-context.tsx`
- 삭제 또는 미사용 처리 `src/components/user-header-loader.tsx`

context 계약:

```ts
type ViewerProfile = {
  role: 'user' | 'admin' | 'superuser';
  points: number;
  onboarding_completed: boolean;
};

type ViewerState = {
  status: 'loading' | 'anonymous' | 'authenticated';
  user: User | null;
  profile: ViewerProfile | null;
  supabase: SupabaseBrowserClient;
  refresh: () => Promise<void>;
};
```

세부:

1. Provider mount 후 `auth.getUser()`를 정확히 한 번 호출한다.
2. user가 있으면 profile의 `role, points, onboarding_completed`를 한 번 조회한다.
3. `onAuthStateChange`에서 state를 갱신하고 cleanup에서 unsubscribe한다.
4. `UserHeaderClient`는 loading일 때 고정 폭 skeleton, anonymous일 때 login, authenticated일 때 기존 `UserHeaderMenu`를 렌더한다.
5. `OnboardingGuard`는 자체 Supabase 호출을 삭제하고 viewer profile이 로드된 후 redirect한다.
6. `NotificationProvider`는 자체 `auth.getUser()`를 삭제하고 viewer user가 authenticated일 때만 self-repair한다.
7. `ChatUnreadProvider`는 자체 초기 auth 호출을 삭제하고 viewer user/supabase를 사용한다. realtime subscribe는 `requestIdleCallback` 또는 1.5초 timeout fallback 뒤 시작해 first paint와 경쟁하지 않게 한다.
8. sign-out 후 provider state가 anonymous로 바뀌고 chat channel/notification UI가 정리되는지 확인한다.

#### 4.2 server header cookie dependency 제거

1. `PublicLayout`에서 server `createClient()`와 `UserHeaderLoader` import를 완전히 제거한다.
2. Suspense fallback과 같은 크기의 `UserHeaderClient`를 배치해 layout shift를 막는다.
3. public home server tree 어디에도 `cookies()`/`headers()` 호출이 남지 않았는지 `rg`와 build output으로 확인한다.

#### 4.3 exact home middleware fast path

대상: `src/middleware.ts`

세부:

1. `/ko`와 `/en` exact pathname(GET/HEAD)에만 `NextResponse.next()` fast path를 둔다.
2. 이 fast path는 `updateSession()`과 `intlMiddleware()`를 모두 건너뛰어 Supabase auth network와 `Set-Cookie: NEXT_LOCALE`을 제거한다.
3. `/`, `/admin`, `/match`, `/mypage`, `/chat`, auth callback 및 모든 다른 route는 기존 흐름을 그대로 둔다.
4. OPTIONS와 bot rewrite 순서는 기존 동작을 보존한다. exact home fast path는 bot rewrite 뒤, 일반 `updateSession` 전에 둔다.
5. `GET /ko?date=...`도 같은 static shell을 쓰며 date는 client가 처리한다.
6. middleware route classification unit test를 추가해 `/ko/admin`이나 `/ko/match/x`가 fast path에 들어가지 않음을 증명한다.

#### 4.4 static/ISR page 조건 완성

대상: `src/app/[locale]/(public)/page.tsx`, `public/manifest.json`

1. page server 함수에서 `searchParams` 인자/await를 제거한다.
2. `export const revalidate = 15`를 설정한다.
3. manifest `start_url`을 `/ko`로 바꿔 `/` 301을 없앤다. English preference는 기존 `LocalePreferenceRedirect`가 `/en`으로 전환한다.
4. build output에서 `/[locale]`가 `ƒ`이면 완료가 아니다. dynamic API import chain을 추적해 제거하고 `●` 또는 revalidate route로 확인한다.
5. production warm request에서 `Cache-Control`이 public이고 `x-vercel-cache: HIT/STALE`인지 확인한다.

수용 기준:

- anonymous와 로그인 사용자가 동일한 public HTML shell을 받으며 HTML에 e-mail/name/points가 없음.
- header는 hydration 후 올바르게 전환되고 잘못된 관리자 link를 노출하지 않음.
- admin middleware authorization은 그대로 동작.
- `/ko` warm TTFB 중앙값 300ms 이하.

### Phase 5 — PWA/푸시 최종 게이트

이 단계 전까지 `src/app/sw.ts`, `src/lib/push-subscription.ts`의 activation 로직, VAPID 설정을 성능 목적으로 수정하지 않는다.

#### 자동 검증

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run perf:pwa -- --assert
```

추가 확인:

- build된 `public/sw.js`에 `push`와 `notificationclick` listener 존재.
- `precacheEntries: []` 유지.
- `/sw.js` 200, JS MIME, 동일 scope 등록.
- console에 SW registration, hydration, CSP, Better Stack 오류 없음.
- ko/en, 390px/1280px 화면 수동 확인.
- `$powerplay-ui-final-check` 스킬을 실행한다.

#### iPhone 홈 화면 PWA 실기기 필수 검증

1. 기존 PowerPlay PWA와 site data를 삭제한 fresh-install 시나리오를 먼저 실행한다.
2. Safari에서 `/ko` 접속 → 홈 화면에 추가 → standalone 실행.
3. 첫 실행 FCP/LCP 체감 및 skeleton/header 전환 확인.
4. 알림 권한 허용.
5. SW가 active 상태인지 확인하고 `pushManager.subscribe()` 성공 확인.
6. DB에 현재 기기의 subscription이 저장됐는지 관리자 UI로 확인.
7. `/admin/push-test`에서 실발송.
8. 앱 foreground, background/화면 잠금 상태에서 수신 확인.
9. notification tap이 payload URL을 여는지 확인.
10. 앱 완전 종료 후 재실행하여 warm startup과 push 수신을 다시 확인.

어느 하나라도 실패하면 production 배포하지 않고 해당 phase commit만 revert한다.

## 6. 테스트 매트릭스

| 영역 | 단위 | 통합/빌드 | 실환경 |
|---|---|---|---|
| monitoring init | env 없음/있음, sampling, PII scrub | instrumentation register, source-map upload 없는 build도 성공 | Preview test error → source line → Slack |
| health | 200/503/timeout/secret 비노출 | route handler build | Better Stack Asia monitor green |
| heartbeat | success step 조건 | workflow YAML parse | workflow_dispatch 후 heartbeat timestamp |
| public match cache | future filter, counts, null joins | cold/warm query count, tag invalidation | join/cancel 후 15초 이내 홈 count |
| MatchHomeClient | date/rink/type/자리 필터 | home client manifest에 club/rink module 없음 | ko/en mobile interaction |
| viewer | anonymous/auth/profile/auth change | no server cookies on home | login/logout/admin/onboarding/chat badge |
| assets/fonts | picture source 선택 | no remote font/Geist request | light/dark/ko/en visual QA |
| SW/push | existing + 강화된 build test | push listeners in `public/sw.js` | iPhone fresh install/foreground/background/tap |
| performance | metrics parser/budget exit | production build + 5-run median | Better Stack p75 LCP 추세 7일 |

## 7. 단계별 중단/롤백 기준

### 즉시 중단

- `precacheEntries`가 빈 배열이 아니게 됨.
- iOS SW activation이 20초 안에 완료되지 않음.
- push subscription 또는 실발송 실패.
- public HTML/RUM에 email, phone, birth date, cookie, VAPID endpoint/token이 포함됨.
- admin route가 public fast path에 들어감.
- monitoring 추가 후 LCP 중앙값이 100ms 이상 악화됨.

### 단계별 rollback

- Monitoring: env vars/token을 제거하면 fail-open으로 즉시 비활성화. 코드 rollback은 Phase 1 commit만 revert.
- Font/logo: Phase 2 commit revert. 원본 로고 파일은 삭제하지 않아 즉시 복원 가능.
- Data/client split: Phase 3 revert 시 기존 `getCachedMatches/Rinks/Clubs` 경로로 복귀.
- ISR/viewer: Phase 4 revert 시 server header와 기존 middleware auth 흐름으로 복귀.
- Production: Vercel의 직전 정상 deployment로 promote하고 원인 commit을 revert.

## 8. 예상 효과와 비용

| 항목 | 예상 |
|---|---|
| 월 서비스 비용 | 0원(무료 플랜 조건/한도 내) |
| DB query | 홈 anonymous 요청당 반복 query → cached window당 2 query 수준 |
| HTML | 과거 경기 + 불필요 rinks/clubs 제거로 888KB decoded → 300KB 이하 목표 |
| font/logo | render-blocking 외부 font 및 약 50KB Geist 제거, active logo 1개만 전송 |
| first paint | 4G/4x CPU 3.30초 → 1.8초 이하 목표 |
| 오류 대응 | Slack alert → Better Stack grouped error/source map/AI prompt → 재현 및 수정 |

## 9. 무료 조건이 맞지 않을 때의 fallback

Better Stack 무료 약관상 PowerPlay가 대상이 아니거나 무료 항목이 바뀌면 유료 전환하지 않는다.

fallback:

1. 기존 Sentry Developer free를 env 기반으로 정상 연결하고 errors만 수집한다(`tracesSampleRate` 0.02 이하).
2. GitHub Actions를 30분 간격으로만 실행해 private-repo 월 1,440분 이내를 목표로 `/api/health`를 확인한다.
3. 실패 시 기존 `SLACK_WEBHOOK_URL`로 직접 알린다.
4. cron heartbeat는 각 기존 workflow failure/success step의 Slack webhook으로 대체한다.
5. 이 fallback은 3분 탐지와 통합 AI prompt가 없어 권고안보다 약하지만 월 비용은 0원을 유지한다.

## 10. 구현 완료 판정

아래가 모두 참일 때만 완료다.

- [ ] Better Stack/Slack test alert와 실제 test exception이 도착한다.
- [ ] source map으로 실제 TypeScript 파일/라인이 보인다.
- [ ] `/api/health`, `/ko`, `/sw.js` monitor가 green이다.
- [ ] 5개 heartbeat가 정해진 grace 안에 수신된다.
- [ ] monitoring 수집에서 PII/replay/autocapture가 비활성이다.
- [ ] `/[locale]` home build가 dynamic `ƒ`가 아니다.
- [ ] 5회 cold synthetic median이 FCP/LCP/bytes/JS budget을 통과한다.
- [ ] anonymous/authenticated/ko/en/mobile/desktop 기능 회귀가 없다.
- [ ] 전체 lint/typecheck/test/build가 통과한다.
- [ ] 강화된 SW test가 통과한다.
- [ ] iPhone fresh-install push 구독/수신/click test가 통과한다.
- [ ] `$powerplay-ui-final-check`가 통과한다.
- [ ] monitoring과 performance 문서에 최종 수치/alert URL/rollback SHA가 기록된다.

## 11. GPT-5.6 Terra 실행 지시문

승인 후 새 실행 태스크의 첫 prompt에 아래를 그대로 포함한다.

```text
모델은 gpt-5.6-terra를 사용한다.
`.omx/plans/zero-cost-monitoring-and-pwa-startup.md`를 유일한 실행 계획으로 삼아 Phase 0부터 순서대로 구현한다.

절대 규칙:
1. 한 Phase씩 구현하고 그 Phase의 검증이 모두 통과하기 전 다음 Phase로 가지 않는다.
2. 새 유료 서비스와 새 npm runtime dependency를 추가하지 않는다.
3. `src/app/sw.ts`의 `precacheEntries: []`를 유지한다. self.__SW_MANIFEST 기반 precache를 재도입하지 않는다.
4. `public/sw.js`는 직접 편집하지 않는다.
5. secret 값을 출력·커밋하지 않는다.
6. public shell에는 사용자별 정보가 절대 들어가지 않게 한다.
7. 각 Phase를 별도 Lore protocol commit으로 만든다.
8. 기존 사용자 변경을 되돌리지 않는다.
9. 성능 수치는 변경 전/후 같은 측정 조건의 5회 median으로 비교한다.
10. frontend/i18n/PWA 변경 후 `$powerplay-ui-final-check`를 실행한다.
11. 최종 완료 전에 iPhone 실기기 push test가 필요한 상태라면 코드 완료와 배포 완료를 구분해 보고한다.

필수 보고 형식:
- Phase
- 변경 파일
- 검증 명령과 실제 결과
- 성능 before/after
- push gate 상태
- 남은 위험/롤백 commit
```

Terra가 임의로 범위를 넓히지 않도록 다음 순서를 고정한다.

1. Phase 0 측정/테스트
2. Phase 1 monitoring + health + docs
3. Phase 2 font/logo/prefetch
4. 재측정 및 목표 대비 보고
5. Phase 3 data/client split
6. 재측정 및 cache freshness test
7. Phase 4 viewer/static shell
8. 전체 자동 검증
9. Preview 및 Better Stack/Slack 검증
10. iPhone 실기기 push gate
11. production 배포 및 24시간 관찰

## 12. 최종 의사결정 요약

- 모니터링은 기존에 불완전하게 들어간 Sentry 코드를 버리지 않고 Better Stack 무료 수집기로 연결한다.
- 첫 화면 성능은 서비스 워커 precache가 아니라 원격 font, oversized/dual-preload logo, 과거/미사용 데이터, 동적 auth shell을 순서대로 제거해 개선한다.
- 서비스 워커의 install/push lifecycle은 동결하고 회귀 테스트와 iPhone 실기기 gate로 보호한다.
- 가장 위험한 static viewer 전환은 마지막 별도 commit으로 격리해 언제든 이전 server-rendered auth shell로 되돌릴 수 있게 한다.
