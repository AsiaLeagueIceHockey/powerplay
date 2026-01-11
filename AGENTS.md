# AGENTS.md - Power Play Development Guide

## 🚀 Project Overview

**Power Play** is an ice hockey community platform for match management and guest matching.

**Core Values:**
- **i18n (KR/EN)**: English support for foreign players in Korea.
- **One-Link Operation**: Match creation -> Application -> Payment -> Balancing.
- **KakaoTalk Friendly**: Clean text generation for sharing.

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript ^5
- **Style**: Tailwind CSS v4 (Dark mode supported)
- **i18n**: next-intl ^4.7.0 (Locale prefix: `always`)
- **DB**: Supabase (PostgreSQL) + Supabase Auth
- **Maps**: Naver Maps API (`react-naver-maps`)

## ⚠️ Critical Development Guidelines

### 1. Timezone (KST Enforcement)
- **Display**: Always use `timeZone: "Asia/Seoul"`.
- **Input**: `datetime-local` inputs are assumed to be KST.
- **Storage**: Convert KST input to UTC for DB storage: `new Date(input + "+09:00").toISOString()`.
- **Example**:
  ```typescript
  date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  ```

### 2. Admin Protection
- Routes under `/admin` are protected by Middleware.
- **Exception**: `/admin-apply` is public.
- Admin checks must verify `profiles.role === 'admin'`.

### 3. Data Patterns
- **Soft Delete**: Users are not deleted; set `profiles.deleted_at`.
- **Parallel Fetching**: Use `Promise.all()` for independent data.
  ```typescript
  const [t, matches] = await Promise.all([ getTranslations("home"), getMatches() ]);
  ```
- **Schema Changes**: Log changes in `schema_changes.sql`.

### 4. Naver Maps
- **Provider**: Use `NavermapsProvider` with `ncpKeyId`.
- **Env**: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (Client ID from `lxwho2zsgs`).
- **Localhost**: Requires `http://localhost:3000` to be registered in Naver Cloud Console.

## 📂 Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/          # Main Layout (Home, Login, Profile)
│   │   └── (admin)/           # Admin Layout (Sidebar)
│   └── actions/               # Server Actions (CamelCase)
├── components/                # UI Components (kebab-case)
│   ├── rink-map.tsx           # Naver Map Integration
│   └── schedule-view.tsx      # List/Map Toggle & Grouping
├── lib/
│   └── supabase/              # Client/Server/Middleware clients
└── messages/                  # i18n JSON files (ko.json, en.json)
```

## 💻 Commands

```bash
npm run dev          # Start server
npm run build        # Build for production
npm run lint         # Check code quality
```

## 🎨 Code Style & Patterns

### Naming
- **Components**: PascalCase (`MatchCard`)
- **Files**: kebab-case (`match-card.tsx`)
- **Actions**: camelCase (`getMatches`)

### Component Template
```typescript
"use client";
import { useTranslations } from "next-intl";

export function ExampleComponent() {
  const t = useTranslations("namespace");
  return <div className="p-4 bg-zinc-100 dark:bg-zinc-800">{t("title")}</div>;
}
```

### Server Action Template
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

## ✅ Feature Status

### Phase 1 & 2: Core ✅
- [x] Auth (Login/Signup/Profile)
- [x] Match List/Detail/Application
- [x] i18n System

### Phase 3: Admin & Map ✅
- [x] Admin Dashboard (Matches, Participants)
- [x] Rink Map View (Naver Maps)
- [x] Schedule Grouping (By Rink)
- [x] Smart Share (Web Share API)

### Phase 4: Polish 🔄
- [x] SEO / OG Images
- [ ] Vercel Deployment
