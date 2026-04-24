---
name: powerplay-context
description: Power Play 프로젝트의 핵심 도메인 규약(KST timezone, soft delete, 역할 체계 user/admin/superuser, Supabase RLS/SECURITY DEFINER RPC, i18n scope, path alias, 파일명 컨벤션, 카드/버튼 UI 가드레일)을 통합 제공한다. Power Play 코드베이스의 `src/`, `sql/`, `messages/` 어느 곳이든 작업을 시작하기 전에 반드시 이 스킬을 먼저 읽어 규약을 확인하라. 신기능 추가, 리팩토링, 버그 수정, QA 등 모든 작업에 해당된다.
---

# Power Play — 프로젝트 컨텍스트

Power Play는 아이스하키 동호회 경기 운영·게스트 매칭 플랫폼이다. 이 스킬은 모든 에이전트가 작업 전 읽는 **공통 규약**을 담는다. 상세가 필요하면 `references/` 로 이동한다.

## 1. 기술 스택 (요약)

- **Framework**: Next.js 16.1.1 (App Router) + React 19
- **Language**: TypeScript strict
- **Style**: Tailwind CSS v4 (+ shadcn 스타일 통일)
- **i18n**: `next-intl` ^4.7.0 (locale prefix `always`)
- **DB**: Supabase (PostgreSQL) + Supabase Auth
- **Maps**: Naver Maps (`react-naver-maps`)
- **PWA**: serwist
- **Error**: Sentry

## 2. 디렉토리 요지

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/    ← 공개/유저 레이아웃 (EN 필수)
│   │   └── (admin)/     ← 관리자 레이아웃
│   ├── actions/         ← Server Actions (camelCase)
│   └── api/             ← Route Handlers
├── components/          ← kebab-case 파일
├── lib/                 ← 유틸, supabase 클라이언트
├── middleware.ts        ← 역할 기반 보호
└── messages/            ← ko.json / en.json (root `messages/` 아님 주의: src 외부에도 `messages/` 있음)
sql/                     ← v1~vN 버전 마이그레이션
```

`messages/` 디렉토리 위치는 코드를 직접 열어 확인한다 (프로젝트 기간 변경되었을 수 있음).

## 3. 핵심 규약 (위반 빈도순)

### 3.1 KST Timezone 강제
- **표시**: 모든 날짜/시간은 `timeZone: "Asia/Seoul"` 명시
- **입력**: `datetime-local` input은 KST로 간주
- **저장 전 변환**: `new Date(input + "+09:00").toISOString()`
- `new Date()` 직접 호출은 서버/클라 타임존 차이로 버그 발생 가능 → KST 유틸 통과 필수

### 3.2 역할 체계 (user / admin / superuser)

- `user` (기본) / `admin` (동호회 운영) / `superuser` (플랫폼 전역)
- **superuser는 admin 상위**. admin 권한 체크 시 superuser도 허용:
  ```ts
  if (!["admin", "superuser"].includes(role)) return redirect("/");
  ```
- superuser 전용 기능은 별도 `checkIsSuperUser()`로 체크
- `/admin` 라우트는 middleware에서 보호. 예외: `/admin-apply` (공개)

### 3.3 Soft Delete
- `profiles` 및 유저 관련 테이블은 물리 삭제 금지
- `deleted_at TIMESTAMPTZ` 컬럼으로 관리
- DELETE 쿼리 대신 UPDATE 또는 지정 RPC

### 3.4 i18n Scope
- **public/user 페이지** (`app/[locale]/(public)/*`): EN 필수
- **superuser 전용 페이지**: 하드코딩 한국어 허용
- **일반 admin 페이지**: 사안별 판단 (계획 문서 참조)

### 3.5 Supabase RLS & SECURITY DEFINER RPC
- 새 테이블은 RLS ON 기본. 역할별 정책 명시.
- RLS 우회 필요 시 `SECURITY DEFINER` RPC로 좁게 오픈. 예: `get_user_push_tokens` (`sql/v18_secure_push_rpc.sql`).
- `SUPABASE_SERVICE_ROLE_KEY`를 앱에서 사용 금지.

### 3.6 SQL 마이그레이션
- 파일명: `sql/v{N+1}_{snake_case_desc}.sql`
- Enum 값 추가는 2단계 커밋 (ALTER TYPE 커밋 → 사용 커밋). PostgreSQL은 같은 트랜잭션에서 enum 확장+사용이 실패.
- 롤백 SQL 동반 권장

### 3.7 코드 스타일
- 파일/폴더: `kebab-case` (`match-card.tsx`)
- 컴포넌트: `PascalCase`
- Server Actions / 변수 / 함수: `camelCase`
- Path alias: `@/*` (상대경로 지양)
- `any` / `@ts-ignore` 금지, strict TS

### 3.8 Server Action 파일 규약
- `"use server";` 최상단
- `src/app/actions/` 에 배치
- **export는 async 함수만**. sync 헬퍼는 미export 또는 `src/lib/`로 이동 (Next.js 빌드 제약).
- 인증/인가 체크는 액션 내부에서

### 3.9 UI 가드레일
- 카드는 `rounded-xl`, hover `border-blue-500 + shadow-md`
- 아이콘+라벨 버튼: `whitespace-nowrap` + `truncate`. 모바일 줄바꿈 금지. 같은 그룹은 폰트·아이콘 크기 통일.
- 사용자 문구는 **사용자 가치 중심**. AI·SEO·개발자 프레이밍 금지.

### 3.10 성능 패턴
- 독립 쿼리는 `Promise.all`
- 클라이언트 컴포넌트는 `"use client";` 명시
- `useTranslations('namespace')` 로 i18n

## 4. Codex용 자산 (참고)

`.agent/` 하위에 Codex용 기존 가이드가 존재한다 (`codex-bootstrap`, `feature-planner`, `powerplay-developer-guide` 등). 이는 **참고 자료**로만 사용하고, Claude Code의 소스는 `.claude/` 하위를 우선한다. `.agent/` 내용을 그대로 복사하지 말고 요약·재해석해 활용한다.

## 5. 소스 우선순위

다음 순서로 신뢰한다:
1. `.claude/skills/` 각 스킬 규약 (이 문서 포함)
2. `AGENTS.md`
3. `src/`, `sql/`, `messages/` 현재 상태
4. `.agent/` Codex 자료 (참고)
5. `README.md` (기획 초기 상태 반영, 충돌 시 무시)

## 6. 에이전트별 가이드 (이 스킬 외 참조)

- DB 변경 → `db-migration-writer` 스킬
- Next.js 코드 → `nextjs-patterns` 스킬
- i18n 작업 → `i18n-sync` 스킬
- QA → `boundary-audit` 스킬

## 7. 의심스러울 때

도메인 판단이 애매하면 **임의로 추정하지 말고 사용자에게 질문한다.** 특히 역할 체계, 피처 분류, 배포 타이밍, 환경 분류는 잘못된 가정이 큰 문제를 일으킨다.
