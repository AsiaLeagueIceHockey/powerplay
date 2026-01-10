# 🏒 Power Play - Project Context & Roadmap

> **최종 업데이트:** 2026-01-10  
> **현재 상태:** Phase 2+ 완료 ✅

---

## 📋 프로젝트 개요

**Power Play(파워플레이)**는 아이스하키 동호회 경기 운영 및 게스트 매칭 관리 플랫폼입니다.

### 핵심 가치
- **다국어 지원 (KR/EN):** 외국인 멤버의 언어 장벽 해소
- **링크 하나로 모든 운영:** 경기 생성 → 신청 → 입금 확인 → 팀 밸런싱
- **카카오톡 최적화:** 복사/붙여넣기 없는 깔끔한 공지 생성

---

## 🛠 기술 스택

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| i18n | next-intl | ^4.7.0 |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (SSR) | @supabase/ssr |

---

## ⚠️ 개발 시 주의사항

### 1. 타임존 (KST 강제)
- **모든 날짜/시간 포맷팅에 반드시 `timeZone: "Asia/Seoul"` 적용**
- `toLocaleDateString()`, `toLocaleTimeString()`, `Intl.DateTimeFormat` 사용 시 필수
- DB에 저장된 `start_time`은 UTC이므로 표시 시 KST 변환 필요

예시:
```typescript
date.toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",  // 필수!
});
```

### 2. Admin 경로 보호
- `/admin` 포함 경로는 미들웨어에서 관리자 권한 확인 후 보호
- **예외:** `/admin-apply`는 일반 사용자도 접근 가능 (관리자 신청 페이지)

### 3. 회원 탈퇴 (Soft Delete)
- 회원 탈퇴 시 실제 삭제가 아닌 `profiles.deleted_at` 타임스탬프 설정
- 탈퇴한 사용자 데이터는 조회 불가능하도록 RLS 정책 고려 필요

### 4. DB 스키마 변경
- 새 칼럼 추가 시 `schema_changes.sql`에 기록
- 운영 DB에 수동 실행 필요 (Supabase Dashboard SQL Editor)

### 5. 경기 시간 저장 (KST → UTC)
- `datetime-local` 입력값은 KST로 가정
- 저장 시 UTC로 변환: `new Date(input + "+09:00").toISOString()`

### 6. 병렬 데이터 페칭 (성능 최적화)
- **독립적인 데이터는 `Promise.all()`로 병렬 실행**
- 의존 관계가 있는 쿼리만 순차 실행

예시:
```typescript
// ✅ 병렬 실행 (권장)
const [t, allMatches] = await Promise.all([
  getTranslations("home"),
  getMatches(),
]);

// ❌ 순차 실행 (느림)
const t = await getTranslations("home");
const allMatches = await getMatches();
```

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (admin)/admin/     # 관리자 대시보드
│   │   └── (public)/          # 공개 페이지
│   │       ├── login/         # 로그인
│   │       ├── signup/        # 회원가입
│   │       ├── profile/       # 프로필
│   │       ├── match/[id]/    # 경기 상세
│   │       ├── admin-apply/   # 관리자 신청
│   │       ├── about/         # 서비스 소개
│   │       └── mypage/        # 마이페이지
│   └── actions/               # Server Actions
├── components/                # 재사용 컴포넌트
├── i18n/                      # 다국어 설정
└── lib/supabase/              # DB 클라이언트
```

---

## ✅ 개발 체크리스트

### Phase 1: Foundation ✅
- [x] Next.js 16 + TypeScript 프로젝트 초기화
- [x] Tailwind CSS 설정
- [x] next-intl 다국어 설정 (ko/en)
- [x] Supabase 연동 (Server/Client/Middleware)
- [x] 데이터베이스 스키마 정의 (schema.sql)
- [x] RLS 정책 구현

---

### Phase 2: Core Logic ✅
#### 인증 ✅
- [x] 회원가입 페이지 `/signup`
- [x] 로그인 페이지 `/login`
- [x] 로그아웃 기능
- [x] 인증 버튼 컴포넌트 (Header)
- [x] 동적 인증 메일 도메인 (`emailRedirectTo`)

#### 프로필 ✅
- [x] 프로필 페이지 `/profile`
- [x] 프로필 수정 폼 (이름, 포지션, 선호언어)

#### 경기 UI ✅
- [x] 경기 목록 (메인 페이지)
- [x] 날짜별 필터 (가로 스크롤, 2주간 표시)
- [x] 경기 카드 컴포넌트 (컴팩트 디자인)
- [x] 경기 상세 페이지 `/match/[id]`
- [x] 참가자 목록 컴포넌트
- [x] 참가 신청/취소 기능
- [x] 과거 경기 "경기완료" 배지 (KST 기준)

#### Admin 보호 ✅
- [x] Middleware에 `/admin` 경로 보호 로직 추가
- [x] `/admin-apply` 예외 처리 (일반 사용자 접근 허용)
- [x] 관리자 권한 확인 후 비관리자 리다이렉트

---

### Phase 3: Admin & Interaction ✅
#### 관리자 대시보드 ✅
- [x] 경기 목록 (`/admin/matches`) - 대시보드 제거, 경기관리로 바로 이동
- [x] 경기 생성 폼 (`/admin/matches/new`)
- [x] 경기 수정 페이지 (`/admin/matches/[id]/edit`) - KST 시간 표시
- [x] 계좌번호 필드 추가
- [x] 참가자 입금 확인 토글

#### Smart Share ✅
- [x] Web Share API 활용 (title + text + url 함께 공유)
- [x] 폴백: 클립보드 복사

#### 관리자 신청 ✅
- [x] `/admin-apply` 페이지 (기능 소개 + 신청 버튼)
- [x] 드롭다운에서 "관리자 신청" / "관리자 페이지" 분기

#### 회원 탈퇴 ✅
- [x] Soft Delete 구현 (`profiles.deleted_at`)
- [x] 회원 탈퇴 모달

#### 서비스 소개 ✅
- [x] `/about` 페이지 (문제점, 해결책, 주요 기능)

---

### Phase 4: Polish & Deploy 🔄
- [x] 동적 OG 이미지 생성
- [x] SEO Meta 태그
- [x] sitemap.xml, robots.txt
- [x] 모바일 반응형 최적화
- [ ] Vercel 배포

---

## 📝 참고

- [README.md](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/README.md) - 전체 기획
- [schema.sql](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/schema.sql) - DB 스키마
- [schema_changes.sql](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/schema_changes.sql) - 추가 DB 마이그레이션
