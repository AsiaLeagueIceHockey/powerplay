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
| 1 | **캘린더 뷰** | 한눈에 경기 일정 확인. "당장 오늘 어느링크장 몇시에 대관있는지" 캘린더로 바로 확인 | `[x]` |
| 2 | **전국 링크장 지도** | 협회사이트에도 없는 링크장 지도. 내 위치 기반 가까운 링크장 검색, 풀링크 + 미니링크 지원 | `[x]` |
| 3 | **전국 게스트 매칭** | 동호회 시스템 기반 게스트 참여. 동호회 생성/가입, 멤버/게스트 구분, 온보딩 플로우 | `[x]` |

### 🟠 P1 (핵심 - 2-4주)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 4 | **푸시 알림 시스템** | 관리자가 대관 새경기 생성하면 이용자한테 알림. 밴드만드는운영자가 중요공지 올렸을때만 전체 알림. 개인이 글올리는건 따로 알림이 안가서 이용자가 수시로 들어와서 확인해야지만 알수있음 → 해결 | `[x]` (PWA Basics) |
| 5 | **운영진 공지 관리** | 공지가 카톡 대화에 묻혀 휘발되지 않도록 고정 공지 기능 | `[x]` (동호회 공지) |
| 6 | **반복 경기 템플릿 (복붙개념)** | "같은요일 같은시간 같은링크장 매주 진행되는경우가 많으니 그걸 복붙개념" - 정기 경기 자동 생성 | `[ ]` |
| 7 | **대기자 자동 승격** | 참가자 취소 시 대기자 자동 컨펌 + 알림 | `[ ]` |
| 8 | **신청자 프로필 정보** | 어느팀, 그팀의 디비전, 주포지션 표시 | `[ ]` |

### 🟣 P7. UI/UX 디자인 통일 (UI Polish)
- **필터 동작**: 특정 날짜 클릭 시 해당 날짜만 필터링. 전체 클릭 시 필터 해제. 직관성 개선.
- **카드 스타일**: 모든 카드형 UI(`MatchCard`, `ClubCard` 등)를 **`rounded-xl`**로 통일.
- **인터랙션**: Hover 시 **`border-blue-500` + `shadow-md`** 효과를 공통 적용하여 프리미엄 느낌 강화.
- **버튼 스타일**: 주요 버튼의 곡률을 `rounded-xl`로 조정하여 카드와 조화롭게 변경.
- **헤더(Header)**: 모바일에서 닉네임 숨김(`hidden md:block`) 및 요소 찌그러짐 방지(`flex-shrink-0`) 적용.

### 🟢 P2 (성장 - 4주+)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 9 | **링크장 등록 요청** | 사용자가 없는 링크장 직접 등록 요청 ("김포링크장이 없나요 등록해봐야겠다") | `[ ]` |
| 10 | **그룹 레슨 / 하키 캠프 주최** | "윤정님 펀드하기 + 하키캠프같은것들도 여기서 주최가되면 좋겠네요..!" | `[ ]` |
| 11 | **게스트비 가이드라인** | "게스트비 3만원이상글은 못올리게 크게 공지" - 시장 표준화 유도 | `[ ]` |
| 12 | **블랙리스트 관리** | 지각/노쇼 상습자를 운영진이 체크하고 관리할 수 있는 기능 | `[ ]` |

### 🔵 P3 (검증됨 - 유지)

| # | 기능 | 상세 | 상태 |
|---|------|------|------| 
| ✅ | **카카오 로그인** | "가입필요없이 카톡으로 로그인" | `[x]` |
| ✅ | **실시간 신청자 수** | "그게 제일 핵심인듯해요" / "신청자수도 모집자 입장에선 편리하고" | `[x]` |
| ✅ | **관리자 신청/승인** | "우측상단이름 메뉴누르면 관리자 신청버튼있고 그거 바로 처리되거든요" | `[x]` |
| ✅ | **상황판 UI** | "마치 상황판 같아서 좋네요 ^^" | `[x]` |

---

## 🚨 결제/환불/노쇼 관리 - Pain Point & 해결 방안

> 2026.01.15 사용자 피드백 기반. 현재 **사업자 등록 미비**로 결제 모듈 연동 불가.

### 💢 현재 Pain Points

| 문제 | 상세 |
|------|------|
| **당일 취소 노쇼** | "운영진이 제일 골머리 아픈부분이 그거예요. 온다고 했다가 당일대부분저녁운동인데 몇시간전에 갑자기 못가요 해버리면" |
| **플레이어 구하기 어려움** | "플레이어 구할시간도 없고 돈도 안보내고" |
| **선입금 없는 신청** | "그래서 대부분 요즘은 그래도 신청할때 선입금을 받는 추세이긴한데" |
| **환불 정책 부재** | "당일취소는 환불안되도록 / 전날까지는 환불해주고" |

### ✅ 현재 제약사항 내 해결 방안

#### 1. 🏷️ 환불 정책 명시 시스템 (개발 가능)
```
- 경기 생성 시 "환불 정책" 필드 추가 (예: "당일취소 환불불가, 전날까지 100% 환불")
- 경기 상세 페이지에 정책 명확히 표시
- 참가 신청 시 정책 동의 체크박스
```

#### 2. 📋 블랙리스트/신뢰도 시스템 (개발 가능)
```
- 운영진 전용 메모 기능: 특정 사용자에 대한 비공개 메모 ("노쇼 이력 2회" 등)
- 참가자 목록에 운영진에게만 보이는 ⚠️ 아이콘 표시
- 전체 공개 X, 운영진끼리만 공유되는 정보
```

#### 3. 💵 입금 확인 시스템 강화 (개발 가능)
```
- "입금확인" 상태가 되어야만 "참가 확정" 처리
- 미입금자는 별도 색상/상태로 표시 (현재도 일부 구현)
- 경기 X시간 전 미입금자 자동 알림 발송
```

#### 4. ⏰ 막판 할인가 모집 (개발 가능)
```
- 경기 당일 X시간 전부터 "급모집" 상태 활성화
- 할인가 표시 기능 (원가 30,000원 → 할인가 20,000원)
- 급하게 올 수 있는 사람 유도
```

#### 5. 📊 신청자 통계/이력 (개발 가능)
```
- 사용자별 참가 이력 조회 (취소율, 노쇼율)
- 운영진에게만 보이는 신뢰도 점수
- 신규 가입자 vs 기존 참여자 구분 표시
```

### 🔮 장기적 해결 (사업자 등록 후)

| 기능 | 설명 |
|------|------|
| **온라인 결제 연동** | 토스/카카오페이 등 PG 연동으로 선결제 처리 |
| **자동 환불 시스템** | 취소 시점에 따라 자동 환불률 적용 |
| **정산 시스템** | 동호회 운영측에 수수료 제외 후 정산 |
| **수수료 모델** | "이용자들이 뛰는사람들은 수수료 천원씩 받으면될거타고 될거같고" |

---

### 💡 추가 아이디어 (미래)

| 아이디어 | 출처 |
|----------|------|
| 운영자 자발적 등록 분위기 조성 | "핵심은 운영자분들이 이 어플로오셔서 자발적으로 등록하는 분위기를 만들어야하는데" |
| 소문 바이럴 전략 | "근데 소문은금방날거예요" / "써본사람들이 편하면 쓸듯" |
| 한명 당 가치 제공 | "딱 한명만 플랫폼에 들어와도 가치를 느낄 수 있을만한 거 한개가 더 있으면 좋을것같은데요" |
| 도메인 변경 | "도메인 조금 괜찮아보이는 것으로 변경하고 하면" |
| 수수료 심리적 저항 낮춤 | "처음부터 수수료를 딱정해서 받아야지 아니면 무료로 쓰다가 나중에 돈내라 그러면반감을 살테니" |

---

### 📋 개발 진행 방식

1. 각 피쳐 작업 시작 전 `상태` 를 `[/]` 로 변경
2. 작업 완료 시 `[x]` 로 변경
3. 관련 스키마 변경은 `sql/` 디렉토리에 버전별로 기록 (예: `v11_새기능.sql`)
4. i18n 키는 `messages/ko.json`, `messages/en.json` 동시 추가

---

## 📁 SQL 스키마 파일 구조

모든 데이터베이스 스키마 파일은 `sql/` 디렉토리에 버전 순서대로 정리되어 있습니다.

| 파일명 | 설명 |
|--------|------|
| `v1_schema.sql` | 초기 스키마 (profiles, matches, participants, rinks) |
| `v2_schema_changes.sql` | 링크 테이블 확장, 클럽 시스템 추가 |
| `v3_schema_changes_v2.sql` | max_skaters/max_goalies 통합 |
| `v4_schema_clubs_v2.sql` | 동호회 시스템 개선 |
| `v5_schema_clubs_v3.sql` | 동호회 시스템 추가 개선 |
| `v6_rink_updates.sql` | 링크 정보 업데이트 |
| `v7_schema_push.sql` | 푸시 알림 스키마 |
| `v8_schema_points_step1.sql` | 포인트 시스템 ENUM 추가 (먼저 실행) |
| `v9_schema_points_step2.sql` | 포인트 시스템 테이블/RLS/함수 |
| `v10_schema_superuser_fix.sql` | SuperUser RLS 권한 추가 |

**새 스키마 추가 시**: `v{다음번호}_{설명}.sql` 형식으로 파일 생성

---

## 💰 포인트 시스템 (Point System)

> 2026.01.19 구현 완료. 사업자등록 전까지 직접 결제 모듈 대신 포인트 충전 시스템으로 운영.

### 시스템 개요

```
사용자 → 포인트 충전 요청 → 은행 이체 → SuperUser 확인 → 포인트 적립
사용자 → 경기 참가 → 포인트 차감
사용자 → 경기 취소 → 환불 정책에 따라 포인트 환불
```

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles.points` | 사용자 보유 포인트 |
| `matches.entry_points` | 경기 참가비 (포인트) |
| `point_transactions` | 포인트 거래 내역 (charge/use/refund/admin_adjustment) |
| `point_charge_requests` | 포인트 충전 요청 (pending/confirmed/rejected/canceled) |
| `platform_settings` | 플랫폼 설정 (bank_account, refund_policy) |

### 역할 (Roles)

| 역할 | 권한 |
|------|------|
| `user` | 일반 사용자 (기본) |
| `admin` | 동호회 관리자 (경기/링크/동호회 CRUD) |
| `superuser` | 플랫폼 관리자 (admin 권한 + 포인트 충전 확인 + 플랫폼 설정) |

### 주요 파일

| 경로 | 설명 |
|------|------|
| `src/app/actions/points.ts` | 포인트 조회/충전 요청/히스토리 서버 액션 |
| `src/app/actions/superuser.ts` | SuperUser 전용 서버 액션 (충전 확인/거부, 설정 관리) |
| `src/app/[locale]/(public)/mypage/points/page.tsx` | 사용자 포인트 히스토리 페이지 |
| `src/app/[locale]/(public)/mypage/points/charge/page.tsx` | 포인트 충전 신청 페이지 |
| `src/app/[locale]/(admin)/admin/settings/page.tsx` | SuperUser 플랫폼 설정 페이지 |
| `src/app/[locale]/(admin)/admin/charge-requests/page.tsx` | SuperUser 충전 요청 관리 |
| `src/components/charge-form.tsx` | 포인트 충전 폼 (계좌 복사 기능 포함) |
| `src/components/settings-form.tsx` | 플랫폼 설정 폼 (계좌/환불정책) |

### 환불 정책

- SuperUser가 `/admin/settings`에서 설정
- 예: 24시간 전 100%, 6시간 전 50%, 당일 0%
- `platform_settings.refund_policy`에 JSONB로 저장
- 경기 취소 시 `calculateRefundPercent()` 함수로 계산

### SuperUser 설정 방법

```sql
-- Supabase SQL Editor에서 실행
UPDATE profiles SET role = 'superuser' WHERE email = 'your-email@example.com';
```

---

## 📋 TODO 2026.01.20 - 사용자 피드백 기반 구현 계획

> 조윤정님(아이스하키) 카카오톡 피드백 기반. "운영자+참가자 둘다 편해지는 구조" 목표.

### 🔴 P0. 신청 플로우 개선 (핵심!) - 🚧 진행중

**현재 문제점:**
```
대관 발견 → 신청 클릭 → 포인트 부족 → 충전 페이지 → 이체 → 관리자 확인 대기 → 다시 대관 찾아서 신청
= "번거로움 + 이탈" 우려
```

**개선 목표 (티머니/선불카드 개념):**
```
신청 클릭 → 포인트 부족 시 충전 → 바로 신청 완료 (대기 상태) → 관리자 확인 → 확정 + 인원수 카운트
= "한번만 신청하면 끝"
```

#### ✅ 완료된 구현:

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `sql/v11_participant_payment_flow.sql` | `pending_payment` ENUM 추가 + profiles 컬럼 확장 | `[x]` |
| `src/app/actions/match.ts` joinMatch | 포인트 충분→confirmed, 부족→pending_payment 분기 | `[x]` |
| `src/app/actions/match.ts` cancelJoin | pending_payment면 환불 없이 삭제 | `[x]` |
| `src/app/actions/cache.ts` | 인원수 카운트 `confirmed`만 포함 (pending_payment 제외) | `[x]` |
| `src/app/actions/superuser.ts` | `confirmParticipantPayment`, `cancelPendingParticipant`, `getPendingPaymentParticipants` 함수 추가 | `[x]` |
| `src/components/match-application.tsx` | `currentStatus` prop 추가, pending_payment용 노란색 UI 추가 | `[x]` |

#### ✅ 남은 구현 (완료됨):

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `src/app/[locale]/(public)/match/[id]/page.tsx` | 1) 참가자 필터에 pending_payment 포함 2) currentStatus prop 전달 3) 참가자 목록에 "입금 대기" 배지 추가 | `[x]` |
| `src/app/[locale]/(admin)/admin/charge-requests/page.tsx` | 미입금 참가자 섹션 추가 (확인/취소 버튼) | `[x]` |
| `messages/ko.json`, `messages/en.json` | pending_payment 관련 번역 추가 | `[x]` |
| **SQL 실행** | `v11_participant_payment_flow.sql` Supabase에서 실행 필요 | `[x]` |

#### 🔧 추가 변경 사항:

- `src/app/actions/match.ts`: MatchParticipant.status에 `pending_payment` 추가
- `src/app/actions/mypage.ts`: MyMatch.participation.status에 `pending_payment` 추가  
- `src/components/admin-participant-list.tsx`: Participant.status에 `pending_payment` 추가

---

### 🟠 P1. 대기자 시스템 (Waitlist)

**필요성:**
- "10명이 딱 맞춰야 하는데 안오면 사람이 비어"
- "그래서 대기자들도 있어서 대기도 걸수있게해놔야하는.."

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **대기자 신청 기능** | 정원 마감 시 "대기 신청" 버튼 표시 | `[x]` |
| **participant.status: waiting** | 대기자 상태 추가 | `[x]` |
| **대기자 목록 표시** | 운영자 및 사용자에게 대기자 명단 표시 | `[x]` |
| **자동 승격** (P2) | 취소 발생 시 대기자 자동 승격 + 알림 (나중에) | `[ ]` |

---

### 🟠 P2. 프로필 설정 강제화

**요청사항:**
- "처음에 로그인하자마자 프로필 설정하기" 바로 해놓는게 좋을것같고
- "기본설정 무조건 해야하니까 기본설정 안되어있으면뜨는걸로"
- 현재: 경기 신청 시에만 온보딩 유도 → **개선: 로그인 후 어디서든 온보딩 미완료 시 유도**

#### 필수 프로필 정보:

| 필드 | 설명 | 현재 |
|------|------|------|
| `full_name` | 실명 (별명보다 실명 선호) | `[x]` |
| `phone` | 휴대폰번호 | `[x]` |
| `birth_date` | 생년월일 (나이 확인용) | `[x]` |
| `avatar_url` | 프로필 사진 (나중에 대화연결 용이) | `[ ]` (optional) |
| `position` | 주포지션 (운영진 참고용) | `[x]` |
| `terms_agreed` | 약관 동의 (개인정보 수집) | `[x]` |

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **profiles 테이블 확장** | phone, birth_date, terms_agreed 컬럼 추가 | `[x]` |
| **온보딩 페이지 수정** | 필수 정보 입력 폼 + 약관 동의 체크박스 | `[x]` |
| **전역 온보딩 체크** | 모든 페이지에서 온보딩 미완료 시 온보딩 페이지로 리다이렉트 | `[x]` |

---

### 🟢 P3. 환불 정책 시간 개선

**요청사항:**
- "24시간 전 무료취소 인걸로 본거같은데 혹시 기준을 전일자정이내로 할 수 있을까요"
- 예: 21일 오후10시 경기 → **20일 자정까지** 무료취소 (24시간 전이면 20일 오후10시)
- "이것도 좋네요 저희입장에서도 관리하기가 저게 더 편할듯요"

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **refund_policy 구조 변경** | `hoursBeforeMatch` → `daysBeforeMatch` 또는 `deadlineType: 'midnight'` (코드 레벨 적용) | `[x]` |
| **환불 계산 함수 수정** | `calculateRefundPercent()` - 경기 전날 자정 기준으로 계산 | `[x]` |
| **설정 UI 수정** | 관리자 설정에서 "X일 전 자정까지" 형식으로 입력 | `[ ]` |

---

### 🟢 P4. SEO 및 도메인 변경 (Domain Migration)

**요청사항:**
- "도메인도 https://powerplay.kr/ 로 신규로 변경했어"
- 검색엔진 최적화(SEO) 및 OG 이미지 교체

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **도메인 변경** | 코드 내 Fallback URL 변경 (`pphockey` -> `powerplay.kr`) | `[x]` |
| **SEO 설정** | `src/app/robots.ts`, `sitemap.ts`, `layout.tsx` 업데이트 | `[x]` |
| **OG 이미지** | 신규 디자인(한국어 부제) 적용 (`public/og-image.png`) | `[x]` |
| **등록 가이드** | `SEO_GUIDE.md` 및 `layout.tsx` 검증 태그 추가 | `[x]` |

### 📌 구현 우선순위 요약

```
1. [P0] 신청 플로우 개선 - "한번만 신청" 이 핵심
2. [P1] 대기자 시스템 - 운영자 필수 기능
3. [P2] 프로필 강제화 - UX 개선 + 개인정보 수집
4. [P3] 환불 정책 시간 - 관리 편의성
```

### 🎯 파워플레이 비전 (피드백에서 추출)

> **파워플레이는 아이스하키 대관운영자가 모집·정산·명단 관리를 자동화하고,  
> 참가자는 신청부터 결제까지 한 번에 끝낼 수 있는 아이스하키 운영 플랫폼**

**하키러브밴드 (기존):** 공지 → 개개인연락 → 입금확인 → 명단수정 → 재공지 = 사람 갈아서 굴리는 구조  
**파워플레이 (목표):** 신청 → 결제 → 확정 → 자동카운트 마감 = 플랫폼이 일하는 구조

