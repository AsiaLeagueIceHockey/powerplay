# AGENTS.md - Power Play Development Guide

## 🚀 Project Overview

**Power Play** is an ice hockey community platform for match management and guest matching. This document provides development guidelines for AI agents.

**Core Values:**
- **i18n (KR/EN)**: Full English support for foreign players in Korea.
- **One-Link Operation**: Manage everything from match creation to team balancing with a single link.
- **KakaoTalk Friendly**: Generate clean, shareable text for KakaoTalk.

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript ^5
- **Style**: Tailwind CSS v4
- **i18n**: `next-intl` ^4.7.0 (Locale prefix: `always`)
- **Database**: Supabase (PostgreSQL) + Supabase Auth
- **Maps**: Naver Maps API (`react-naver-maps`)

---

## 💻 Commands

Use `npm run <command>` to execute the following scripts:

| Command | Description |
| :--- | :--- |
| `dev` | Starts the development server (`next dev`). |
| `build` | Creates a production build (`next build`). |
| `start` | Starts a production server (`next start`). |
| `lint` | Runs ESLint to check for code quality issues (`eslint`). |

**Note:** There is no dedicated test script. Ensure code is high quality and manually verify changes.

---

## ⚠️ Critical Development Guidelines

### 1. Timezone (KST Enforcement)
- **Display**: All dates and times must be displayed in Korean Standard Time. Always use `timeZone: "Asia/Seoul"`.
- **Input**: `datetime-local` input values are assumed to be in KST.
- **Storage**: Convert KST inputs to UTC before storing in the database. Use `new Date(input + "+09:00").toISOString()`.

### 2. Admin Protection
- Routes under `/admin` are protected. Access requires `profiles.role === 'admin'`.
- The protection is implemented in the middleware.
- **Exception**: The `/admin-apply` route is public.

### 3. Data Patterns
- **Soft Deletes**: Never permanently delete user profiles. Instead, set the `profiles.deleted_at` timestamp.
- **Parallel Fetching**: For independent data fetching operations, use `Promise.all()` to improve performance.
- **Schema Changes**: All database schema modifications must be logged in `schema_changes.sql`.

---

## 🎨 Code Style & Patterns

### 1. Naming Conventions
- **Components**: `PascalCase` (e.g., `MatchCard`).
- **Files & Folders**: `kebab-case` (e.g., `match-card.tsx`).
- **Server Actions**: `camelCase` (e.g., `getMatches`).
- **Variables & Functions**: `camelCase`.

### 2. TypeScript
- **Strict Mode**: The project enforces `strict: true`. Avoid `any` and provide explicit types wherever possible. Do not use `@ts-ignore`.
- **Path Aliases**: Use the `@/*` alias for imports from the `src` directory (e.g., `import { createClient } from '@/lib/supabase/server'`).

### 3. Imports
- Follow the standard set by `eslint-config-next`. While not explicitly defined, a good practice is:
  1. React / Next.js imports
  2. External library imports
  3. Internal module imports using path aliases (`@/`)
  4. Relative imports (`../`)
  5. CSS imports

### 4. Component Structure
- Use `"use client";` for components with client-side interactivity.
- Use `useTranslations` from `next-intl` for i18n text.

```typescript
"use client";
import { useTranslations } from "next-intl";

export function ExampleComponent() {
  const t = useTranslations("namespace");
  return <div className="p-4 bg-zinc-100 dark:bg-zinc-800">{t("title")}</div>;
}
```

### 5. Server Actions
- Use `"use server";` at the top of the file.
- Server actions should be defined in `src/app/actions/`.
- Always handle authentication and authorization within the action.

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  // Auth Check...
  // DB Operation...
  return { success: true };
}
```

### 6. Error Handling
- Use try/catch blocks for database operations and API calls.
- Provide meaningful error messages. For user-facing errors, use translations from `next-intl`.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/          # Main Layout (Home, Login, Profile)
│   │   └── (admin)/           # Admin Layout (Sidebar)
│   └── actions/               # Server Actions (camelCase)
├── components/                # UI Components (kebab-case files)
│   ├── rink-map.tsx           # Naver Map Integration
│   └── schedule-view.tsx      # List/Map Toggle & Grouping
├── lib/
│   └── supabase/              # Client/Server/Middleware clients
└── messages/                  # i18n JSON files (ko.json, en.json)
```

---

## 🗺️ ROADMAP - 킬링 피쳐 개발 계획

> 카카오톡 사용자 피드백 기반 기능 우선순위 (2026.01.13 추출)

### 🔴 P0 (최우선 - 1-2주 내)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 1 | **캘린더 뷰** | 한눈에 경기 일정 확인. "당장 오늘 어느링크장 몇시에 대관있는지" 캘린더로 바로 확인 | `[ ]` |
| 2 | **전국 링크장 지도** | 협회사이트에도 없는 링크장 지도. 내 위치 기반 가까운 링크장 검색, 풀링크 + 미니링크 지원 | `[ ]` |
| 3 | **전국 게스트 매칭** | "무장 들고 다니다가 쑥 참여" - 전국 어디서든 게임 찾기, 지역별/레벨별 필터링 | `[ ]` |

### 🟠 P1 (핵심 - 2-4주)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 4 | **푸시 알림 시스템** | 관리자가 대관 새경기 생성하면 이용자한테 알림. 밴드만드는운영자가 중요공지 올렸을때만 전체 알림. 개인이 글올리는건 따로 알림이 안가서 이용자가 수시로 들어와서 확인해야지만 알수있음 → 해결 | `[ ]` |
| 5 | **운영진 공지 관리** | 공지가 카톡 대화에 묻혀 휘발되지 않도록 고정 공지 기능 | `[ ]` |
| 6 | **반복 경기 템플릿 (복붙개념)** | "같은요일 같은시간 같은링크장 매주 진행되는경우가 많으니 그걸 복붙개념" - 정기 경기 자동 생성 | `[ ]` |
| 7 | **대기자 자동 승격** | 참가자 취소 시 대기자 자동 컨펌 + 알림 | `[ ]` |

### 🟢 P2 (성장 - 4주+)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 8 | **링크장 등록 요청** | 사용자가 없는 링크장 직접 등록 요청 ("김포링크장이 없나요 등록해봐야겠다") | `[ ]` |
| 9 | **그룹 레슨 / 하키 캠프 주최** | "윤정님 펀드하기 + 하키캠프같은것들도 여기서 주최가되면 좋겠네요..!" | `[ ]` |
| 10 | **게스트비 가이드라인** | "게스트비 3만원이상글은 못올리게 크게 공지" - 시장 표준화 유도 | `[ ]` |
| 11 | **수수료 모델 검토** | 미니링크나 그룹레슨하는분들에게 천원이천원정도 수수료야 충분히 내면서 이용할거 | `[ ]` |

### 🔵 P3 (검증됨 - 유지)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| ✅ | **카카오 로그인** | "가입필요없이 카톡으로 로그인" | `[x]` |
| ✅ | **실시간 신청자 수** | "그게 제일 핵심인듯해요" / "신청자수도 모집자 입장에선 편리하고" | `[x]` |
| ✅ | **관리자 신청/승인** | "우측상단이름 메뉴누르면 관리자 신청버튼있고 그거 바로 처리되거든요" | `[x]` |
| ✅ | **상황판 UI** | "마치 상황판 같아서 좋네요 ^^" | `[x]` |

### 💡 추가 아이디어 (미래)

| 아이디어 | 출처 |
|----------|------|
| 운영자 자발적 등록 분위기 조성 | "핵심은 운영자분들이 이 어플로오셔서 자발적으로 등록하는 분위기를 만들어야하는데" |
| 소문 바이럴 전략 | "근데 소문은금방날거예요" / "써본사람들이 편하면 쓸듯" |
| 한명 당 가치 제공 | "딱 한명만 플랫폼에 들어와도 가치를 느낄 수 있을만한 거 한개가 더 있으면 좋을것같은데요" |
| 도메인 변경 | "도메인 조금 괜찮아보이는 것으로 변경하고 하면" |

---

### 📋 개발 진행 방식

1. 각 피쳐 작업 시작 전 `상태` 를 `[/]` 로 변경
2. 작업 완료 시 `[x]` 로 변경
3. 관련 스키마 변경은 `schema_changes.sql` 에 기록
4. i18n 키는 `messages/ko.json`, `messages/en.json` 동시 추가

