# 🏒 Power Play - Project Context & Roadmap

> **최종 업데이트:** 2026-01-10  
> **현재 상태:** Phase 2 완료 ✅

---

## 📋 프로젝트 개요

**Power Play(파워플레이)**는 아이스하키 동호회 경기 운영 및 용병 매칭 관리 플랫폼입니다.

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
│   │       └── mypage/        # 마이페이지 (예정)
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

### Phase 2: Core Logic 🔄
#### 인증 ✅
- [x] 회원가입 페이지 `/signup`
- [x] 로그인 페이지 `/login`
- [x] 로그아웃 기능
- [x] 인증 버튼 컴포넌트 (Header)

#### 프로필 ✅
- [x] 프로필 페이지 `/profile`
- [x] 프로필 수정 폼 (이름, 포지션, 선호언어)

#### 경기 UI ✅
- [x] 경기 목록 (메인 페이지)
- [x] 경기 카드 컴포넌트
- [x] 경기 상세 페이지 `/match/[id]`
- [x] 참가자 목록 컴포넌트
- [x] 참가 신청/취소 기능

#### Admin 보호 ✅
- [x] Middleware에 `/admin` 경로 보호 로직 추가
- [x] 관리자 권한 확인 후 비관리자 리다이렉트

#### 마이페이지 ✅
- [x] `/mypage` 페이지 생성
- [x] 내가 신청한 경기 목록 표시
- [x] 참가 상태/입금 상태 표시

---

### Phase 3: Admin & Interaction ✅
#### 관리자 대시보드 ✅
- [x] 경기 목록 테이블 (`/admin/matches`)
- [x] 경기 생성 폼 (`/admin/matches/new`)
- [x] 경기 수정 페이지 (`/admin/matches/[id]/edit`)
- [x] 참가자 입금 확인 토글

#### Smart Share ✅
- [x] "Copy for Kakao" 버튼 (한국어 공지)
- [x] "Copy for Global" 버튼 (영/한 병기)

#### Hybrid Admin UI ✅
- [x] 경기 상세에서 관리자 전용 버튼 노출

---

### Phase 4: Polish & Deploy ✅
- [x] 동적 OG 이미지 생성
- [x] SEO Meta 태그
- [x] sitemap.xml, robots.txt
- [x] 모바일 반응형 최적화
- [ ] Vercel 배포

---

## 📊 우선순위

| Feature | Priority |
|---------|----------|
| Admin 경로 보호 | 🔴 즉시 |
| 마이페이지 | 🔴 즉시 |
| 경기 생성 폼 | 🟡 다음 |
| Smart Share | 🟡 다음 |
| OG 이미지 | 🟢 나중 |

---

## 📝 참고

- [README.md](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/README.md) - 전체 기획
- [schema.sql](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/schema.sql) - DB 스키마
