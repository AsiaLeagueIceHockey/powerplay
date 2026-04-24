---
name: nextjs-patterns
description: Power Play의 Next.js 16 App Router 코드 작성 시 사용. Server Actions 규약, route groups((public)/(admin)), 미들웨어 역할 보호, TypeScript strict 패턴, `next-intl` 클라이언트 통합, KST 날짜 처리, Tailwind v4 기반 카드/버튼 UI 가드레일. `src/app/`, `src/components/`, `src/lib/` 파일을 추가·수정·리팩토링하거나 새 페이지·액션·컴포넌트·훅을 만들 때 반드시 트리거.
---

# Next.js Patterns — Power Play 구현 규약

이 스킬은 `code-builder` 에이전트가 주로 사용한다. 실제 코드 작성 시 따라야 할 구체 패턴을 담는다.

## 1. 라우팅 구조

```
src/app/
├── [locale]/
│   ├── (public)/      ← Public Layout (로고+언어+로그인 GNB)
│   │   ├── layout.tsx
│   │   ├── page.tsx   ← 홈
│   │   ├── match/[id]/
│   │   ├── club/[id]/
│   │   └── ...
│   ├── (admin)/       ← Admin Layout (사이드바)
│   │   └── admin/
│   │       ├── dashboard/
│   │       └── matches/
│   └── layout.tsx     ← locale 루트
├── actions/           ← Server Actions (camelCase)
├── api/               ← Route Handlers (최소화, Server Action 선호)
├── layout.tsx         ← root (providers, fonts)
└── middleware.ts      ← 역할 보호
```

Route group `(public)` `(admin)` 은 **URL에 나타나지 않는다.** 폴더명만 레이아웃 분리 목적.

## 2. 미들웨어 역할 보호

`src/middleware.ts` 에서 Supabase 세션을 읽어 `profiles.role`을 확인하고 `/admin/*` 접근 시 리다이렉트한다. 예외: `/admin-apply` 는 공개.

역할 체크 시 `admin + superuser` 를 함께 허용:
```ts
if (!["admin", "superuser"].includes(profile.role)) {
  return NextResponse.redirect(new URL("/", request.url));
}
```

## 3. Server Action 표준

### 3.1 파일 구조
```ts
// src/app/actions/match.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

export async function createMatch(input: CreateMatchInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superuser"].includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }

  // DB 작업
  const { data, error } = await supabase.from("matches").insert({
    ...input,
    start_time: new Date(input.startTimeKst + "+09:00").toISOString(),
  }).select().single();

  if (error) throw error;

  revalidateTag("matches");
  return { ok: true, match: data };
}
```

### 3.2 파일 규약
- `"use server";` 최상단.
- **export는 `async` 함수만.** sync 헬퍼/상수는 미export 또는 `src/lib/` 이동. Next.js 빌드는 sync export를 에러로 잡는다 (`.githooks/pre-commit`에도 관련 체크).
- `revalidateTag` 시그니처가 변경되는 경우가 있으므로 Next 업그레이드 후 typecheck 필수.

### 3.3 에러 반환 패턴
- throw vs return 중 프로젝트에 기존 스타일을 따른다 (코드 확인 필수).
- 유저 노출 에러는 i18n 키 반환 고려.

## 4. 클라이언트 컴포넌트

```tsx
// src/components/match-card.tsx
"use client";

import { useTranslations, useFormatter } from "next-intl";
import type { Match } from "@/lib/supabase/types";

export function MatchCard({ match }: { match: Match }) {
  const t = useTranslations("matchCard");
  const format = useFormatter();

  return (
    <article className="rounded-xl border bg-white p-4 transition
                        hover:border-blue-500 hover:shadow-md">
      <h3 className="whitespace-nowrap truncate">{t("title")}</h3>
      <time dateTime={match.startTime}>
        {format.dateTime(new Date(match.startTime), {
          timeZone: "Asia/Seoul",
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })}
      </time>
    </article>
  );
}
```

### 4.1 필수 체크
- `"use client";` 최상단.
- i18n: `useTranslations(namespace)`.
- 카드: `rounded-xl` + hover `border-blue-500 + shadow-md`.
- 버튼 텍스트: `whitespace-nowrap truncate`. 같은 행의 버튼은 폰트·아이콘 크기 통일.

## 5. Supabase 클라이언트 사용

- 서버: `@/lib/supabase/server` (async, 쿠키 기반 세션)
- 클라이언트: `@/lib/supabase/client`
- 미들웨어: `@/lib/supabase/middleware`

각각 다른 API 면이므로 혼용 금지. 서버 컴포넌트/액션은 서버 클라이언트, 클라이언트 컴포넌트는 클라이언트 클라이언트.

## 6. KST 처리

```ts
// 저장 직전 (KST → UTC)
const utcIso = new Date(kstInput + "+09:00").toISOString();

// 표시 (UTC → KST)
new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "long",
  timeStyle: "short",
}).format(new Date(utcIso));
```

**금지:** 서버에서 `new Date()` 직접 쓰기 (타임존 불일치). 유틸 통과 권장.

## 7. i18n 패턴

- 서버 컴포넌트: `getTranslations("namespace")` (async)
- 클라이언트 컴포넌트: `useTranslations("namespace")`
- 포매터: `useFormatter` / `getFormatter`
- 변수: ICU — `t("greeting", { name })`
- 복수: `t("itemCount", { count })` + 메시지 `{count, plural, =0 {none} one {# item} other {# items}}`

새 키 추가는 i18n-steward와 조율. `code-builder`는 UI에 필요한 키 목록을 보고서에 기록하고 텍스트 리터럴은 즉시 키로 치환해 사용한다.

## 8. TypeScript strict

- `any` 금지. 외부 API 반환도 정확한 타입을 정의해 씌운다.
- `@ts-ignore` 금지 (`.githooks/pre-commit` 에서 잡힐 수 있음).
- `import { createClient } from '@/lib/supabase/server';` (path alias, 상대경로 지양).
- 반환 타입은 명시적 권장 (특히 Server Action).

## 9. UI 패턴 통일

| 요소 | 규칙 |
|------|------|
| 카드 | `rounded-xl`, border, hover 효과 공통 |
| 버튼 | 주요 버튼 `rounded-xl`, 아이콘+라벨 `whitespace-nowrap truncate` |
| 필터 | 날짜 클릭 시 해당 날짜 필터, 전체 클릭 시 해제 |
| 헤더 | 프로필 드롭다운: Person/Coin/Tool 구조. 언어 설정은 마이페이지 하단 |

동호회 상세 액션 버튼 등 **공유 스타일이 있는 컴포넌트는 그 스타일/harness를 재사용한다.** 버튼 하나만 따로 스타일링하지 말 것.

## 10. 성능

- 독립 쿼리 병렬: `Promise.all([getA(), getB(), getC()])`
- Next Image / Serwist 캐시는 기존 설정 유지
- Sentry는 자동 주입됨 (sentry.*.config.ts)

## 11. 작업 종료 체크

구현 완료 후 `_workspace/03_build_report.md` 체크리스트:

- [ ] `"use server"` / `"use client"` 선언
- [ ] path alias `@/*` 사용
- [ ] `any`/`@ts-ignore` 미사용
- [ ] admin 권한 체크에 superuser 포함
- [ ] KST 강제 (표시·저장)
- [ ] soft delete 규약 (DELETE 금지)
- [ ] 새 UI 텍스트는 i18n 키로 (하드코딩 금지 — public/user 영역일 때)
- [ ] `npm run typecheck` 로컬 통과 확인
- [ ] 변경 함수의 사용처 grep 확인
