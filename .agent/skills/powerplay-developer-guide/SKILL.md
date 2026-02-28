---
name: powerplay-developer-guide
description: Comprehensive developer guide for PowerPlay agents. Use this skill to understand project context, rules, and workflows.
---

# PowerPlay Developer Guide

**Role**: You are a developer on the PowerPlay team.
**Mission**: Build a robust ice hockey community platform that wow users.

## 🚀 Project Overview

**PowerPlay** is an ice hockey community platform for match management and guest matching.

**Core Values:**
- **i18n (KR/EN)**: Full English support for foreign players in Korea.
- **One-Link Operation**: Manage everything from match creation to team balancing with a single link.
- **KakaoTalk Friendly**: Generate clean, shareable text for KakaoTalk.

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript ^5 (Strict mode)
- **Style**: Tailwind CSS v4
- **i18n**: `next-intl` ^4.7.0 (Locale prefix: `always`)
- **Database**: Supabase (PostgreSQL) + Supabase Auth
- **Maps**: Naver Maps API (`react-naver-maps`)

---

## ⚠️ Critical Development Rules (MUST FOLLOW)

### 1. Timezone (KST Enforcement)
- **Display**: All dates and times must be displayed in **Korean Standard Time (Asia/Seoul)**.
- **Implementation**: Always use `timeZone: "Asia/Seoul"` in date formatting.
- **Input**: `datetime-local` input values are assumed to be in KST.
- **Storage**: Convert KST inputs to UTC before storing in the database. Use `new Date(input + "+09:00").toISOString()`.

### 2. Admin & Security
- **Protected Routes**: Routes under `/admin` are protected. Access requires `profiles.role === 'admin'`.
- **SuperUser**: `superuser` is a higher privilege role than `admin`.
    - `superuser` can perform all `admin` actions.
    - Check permissions using: `if (!["admin", "superuser"].includes(role))`
- **RPC for Push**: Use `get_user_push_tokens` RPC function for push notifications to bypass RLS safely.

### 3. Localization (i18n)
- **Public Pages**: MUST support both English (`en`) and Korean (`ko`).
- **Translation**: Use `next-intl`.
    - Add keys to `messages/ko.json` AND `messages/en.json`.
    - Use `useTranslations` hook in components.
- **Admin Pages**: Can serve Korean primarily but English translation is encouraged where possible. Superuser pages can be Korean-only.

### 4. Data Patterns
- **Soft Deletes**: NEVER permanently delete user profiles. Use `profiles.deleted_at` timestamp.
- **Schema Changes**: All database schema modifications must be logged in `sql/` directory as `v{version}_{description}.sql`.
- **Parallel Fetching**: Use `Promise.all()` for independent data fetching operations.

---

## 🎨 Code Style & Conventions

> **💡 UI Pattern Guide**: For detailed UI/UX rules (P7 Polish, Dark Mode, etc.), please refer to the `ui-component-pattern` skill.

### 1. Naming
- **Components**: `PascalCase` (e.g., `MatchCard`)
- **Files & Folders**: `kebab-case` (e.g., `match-card.tsx`)
- **Server Actions**: `camelCase` (e.g., `getMatches`) inside `src/app/actions/`

### 2. Component Structure
- Use `"use client";` only when necessary for interactivity.
- Use `useTranslations` for text.
```typescript
"use client";
import { useTranslations } from "next-intl";

export function ExampleComponent() {
  const t = useTranslations("namespace");
  return <div className="p-4 bg-zinc-100 dark:bg-zinc-800">{t("title")}</div>;
}
```

### 3. Server Actions
- Use `"use server";` at the top.
- Handle authentication and authorization within the action.
```typescript
"use server";
import { createClient } from "@/lib/supabase/server";

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  // Auth Check & Logic...
}
```

---

## 📂 Project Structure

- **`src/app/[locale]/(public)/`**: Main layout (Home, Login, Profile) - Public facing.
- **`src/app/[locale]/(admin)/`**: Admin layout - Requires admin privileges.
- **`src/app/actions/`**: Server Actions (Business Logic).
- **`src/components/`**: UI Components (Reusable).
- **`src/lib/supabase/`**: Supabase clients (Client, Server, Middleware).
- **`messages/`**: i18n JSON files (`ko.json`, `en.json`).
- **`sql/`**: Database schema changes.

---

## 💻 Workflows

### Running the Project
- `npm run dev`: Start development server.
- `npm run build`: Create production build.
- `npm run lint`: Check code quality.

### Adding Features
1.  **Plan**: Understand requirements and check `AGENTS.md` roadmap.
2.  **Schema**: Create `sql/v{N}_{feature}.sql` if DB changes are needed.
3.  **i18n**: Add keys to `messages/*.json`.
4.  **Implement**: Code components and server actions.
5.  **Verify**: Test manually.


### Feature Implementation Sets
When developing or modifying "Game" or "Match" related features, ALWAYS address the following areas as a single set to ensure consistency:
1.  **User Side**: Match List & Match Detail Page.
2.  **Admin Side**: Admin Match List, Create Form, and Edit Form.
3.  **Database**: Schema changes and migration files.
4.  **i18n**: Translations for both English and Korean.

### Agent Handover
- Check `.agent/workflows/agent_handover.md` if starting/ending a major task.

---

## ✅ Verification Checklist

Before compiling your work, verify:
- [ ] **KST Timezone**: Are dates displayed in Asia/Seoul?
- [ ] **i18n**: Are all user-facing strings translatable?
- [ ] **Security**: Are admin routes protected? Are RLS policies respected?
- [ ] **Mobile Responsive**: Does the UI look good on mobile?
- [ ] **Clean Code**: No `console.log` (unless for error), no `any` types.

---

## 🚫 Common Pitfalls (Self-Correction Guide)

### 4. Data Synchronization & Caching
- **Issue**: Data in List View (cached) != Data in Detail View (fresh).
- **Rule**: When adding a new column to a table (e.g., `match_type`):
    1. Update `src/app/actions/{entity}.ts` (Fresh fetchers).
    2. **CRITICAL**: Update `src/app/actions/cache.ts` (Cached fetchers).
    3. Update TypeScript interfaces in ALL relevant files.
- **Prevention**: Search for `from("table_name")` in the codebase to find ALL fetchers for that table.

### 5. Destructive Edits (Regression Prevention)
- **Issue**: Accidentally deleting existing code when using `replace_file_content` to add new code.
- **Rule**: When adding a new field to a list (e.g., in a `select` query or a component prop list), ensure you are NOT replacing the *entire* list with just the new item. Check `TargetContent` and `ReplacementContent` carefully. If you want to *add*, include the existing content in `ReplacementContent` as well.
- **Prevention**: Always read the `TargetContent` and ensure all essential parts are present in `ReplacementContent` or are intentionally being removed.

### 6. Database vs TypeScript Mismatch
- **Issue**: Using `startTime` instead of `start_time` in Supabase `select()` queries.
- **Rule**: Supabase/Postgres columns are `snake_case`. TypeScript interfaces might be `camelCase`, but the `select()` string MUST match the database column names exacty.
- **Prevention**: Always check the SQL file or Supabase dashboard for exact column names.

### 2. Translation Scope (i18n)
- **Issue**: Double-prefixing keys like `match.match.types.xxx`.
- **Rule**:
    - `useTranslations("namespace")` -> `t("key")` (Scoped)
    - `useTranslations()` or `getTranslations()` -> `t("namespace.key")` (Global)
    - **CRITICAL**: Do NOT mix namespaces! If you need `admin.x` AND `match.types.y`, use two hooks: `const tAdmin = useTranslations("admin"); const tMatch = useTranslations("match");`
- **Prevention**: Check how `t` is initialized. If it has a namespace, do NOT repeat the namespace in the key.

### 3. Missing Data Safety
- **Issue**: `undefined` values for new columns causing crashes or "undefined" text.
- **Rule**: Always provide fallbacks for new optional fields or fields that might be empty during migration.
    - Bad: `t(match.type)`
    - Good: `t(match.type || 'default')`

### 7. 💰 Financial/Money Code (CRITICAL — Highest Priority)
> **이 규칙은 최우선 순위로 반드시 준수해야 합니다.**

- **반드시 테스트 코드 작성**: 돈과 관련된 모든 흐름(참가 신청, 자동 확정, 환불, 대기 승격 등)은 반드시 `__tests__/` 아래에 테스트 코드를 작성하고 검증한다.
- **모든 비용 구성요소 고려**: 금액 계산 시 `entry_points`, `rental_fee`, `goalie_free` 등 **모든** 비용 구성요소를 빠짐없이 포함해야 한다.
  - **차감 금액 = 환불 기준 금액**: 입금 시 차감하는 금액과 취소 시 환불의 기준이 되는 금액이 반드시 동일 로직이어야 한다.
  - **체크리스트**: 새로운 비용 필드 추가 시, 아래 **모든** 코드 경로를 업데이트해야 한다:
    1. `joinMatch()` — 직접 참가 차감
    2. `confirmPointCharge()` — 충전 후 자동 확정 차감
    3. `promoteWaitlistUser()` — 대기 승격 차감
    4. `cancelJoin()` — 취소 환불 계산
    5. 관리자 경기 취소 환불
- **다양한 시나리오 테스트**: 단순 정상 케이스만이 아니라, 아래 케이스들을 모두 고려:
  - 잔액 부족 → 충전 → 자동 확정 (entry + rental)
  - 무료 골리 (goalie_free) 자동 확정
  - 대기 → 승격 시 비용 처리
  - 취소 시 환불 금액 = 실제 차감 금액 일치 여부
- **임의 판단 금지, 소통 필수**: 자금 관련 로직은 **절대 임의로 판단하지 말 것**. 프롬프트를 입력하는 사용자는 4년차 개발자이므로 충분히 소통 가능하다. 불확실한 사항은 반드시 질문하고 확인받은 후 진행할 것.

