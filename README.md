# 🏒 Power Play (파워플레이)

> **Global Standard Ice Hockey Match Management Platform**
>
> *"No more copy-pasting. Manage your roster, payments, and team balance with a single link."*
>
> **아이스하키 동호회 경기 운영 & 게스트 매칭 관리 플랫폼**

<br/>

## 1. Project Overview (기획 배경)

### 🚩 Pain Points (문제점)
* **비효율적 운영:** 수기 명단 관리, 반복되는 공지 복사/붙여넣기, 입금 내역 수동 대조.
* **정보의 폐쇄성:** 카톡 대화에 묻혀 경기 정보(시간/장소) 확인이 어려움.
* **언어 장벽:** 한국어 공지를 이해하지 못하는 외국인 게스트/멤버 다수 존재.
* **팀 밸런싱 난해:** 텍스트 명단만으로는 포지션(FW/DF/G) 비율 파악이 불가능.

### 💡 Solution (해결책)
**Power Play**는 **다국어(KR/EN)**를 완벽 지원하는 웹 플랫폼으로, **링크 하나**로 경기 생성부터 신청, 입금 확인, 팀 밸런싱, 공지 공유까지 해결합니다.

---

## 2. Tech Stack (기술 스택)

| Category | Tech | Details |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14+** | App Router, Server Actions |
| **Language** | **TypeScript** | Strict typing for reliability |
| **Styling** | **Tailwind CSS** | + Shadcn/ui (Radix UI) |
| **i18n** | **next-intl** | Server & Client side translation (KR/EN) |
| **Database** | **Supabase** | PostgreSQL |
| **Auth** | **Supabase Auth** | Email/Password (MVP), OAuth planned |
| **Logic** | **Edge Functions** | Notification triggers, Scheduling |
| **SEO** | **Open Graph** | Dynamic OG Image for KakaoTalk Previews |
| **Deploy** | **Vercel** | CI/CD Integration |

---

## 3. Core Features (기능 명세)

### 3.1. General & User (게스트/플레이어)
* **🌐 Global Interface (i18n):**
    * 헤더의 `[KR/EN]` 토글로 즉시 언어 전환.
    * 날짜/시간 포맷 자동 변환 (예: `1월 8일` ↔ `Jan 8th`).
* **👤 Profile:** 이름(영/한 병기), 포지션(`FW`/`DF`/`G`), 레벨 설정.
* **🏒 Match & Join:**
    * **직관적 UI:** 색상/아이콘으로 상태(모집중/마감) 식별.
    * **포지션 신청:** 포지션별 잔여석 확인 후 신청.
    * **입금 안내:** 언어 설정에 맞춘 계좌 정보 및 복사 기능.
* **📂 My Page:** 나의 경기 신청 현황 및 확정 여부 확인.

### 3.2. Admin (운영진/호스트)
* **⚡️ Hybrid Admin UI (중요):**
    * **/admin:** 데이터 테이블 기반의 관리자 전용 대시보드.
    * **/match/[id]:** 일반 페이지 접속 시, 관리자에게만 **[수정/마감/텍스트복사]** 버튼 노출.
* **📝 Roster Management:**
    * 신청자 리스트 실시간 확인.
    * **Payment Toggle:** 입금 확인 시 클릭 한 번으로 `Unpaid` → `Paid` 상태 변경.
* **📢 Smart Share (KakaoTalk Optimized):**
    * **`Copy for Kakao`:** 한국어 위주의 깔끔한 텍스트 공지 생성.
    * **`Copy for Global`:** 외국인 멤버를 위한 영/한 병기 공지 생성.
* **⚖️ Team Balancing:** Drag & Drop으로 블랙/화이트 팀 편성 (Lite Feature).

---

## 4. Project Structure & Admin Strategy

We will build this as a **Single Next.js Application** (Monorepo approach not needed).

### 🏗 Folder Structure Strategy
The project uses Next.js **Route Groups** to handle different layouts within a single repo.

```bash
app/
├── (public)/           # Public Layout Group
│   ├── layout.tsx      # GNB (Logo, Login, Lang Toggle)
│   ├── page.tsx        # Main: Match List
│   └── match/[id]/     # Match Detail (Hybrid Admin Controls here)
│
├── (admin)/            # Admin Layout Group
│   ├── admin/          # URL base: /admin
│   │   ├── layout.tsx  # Admin Sidebar Layout
│   │   ├── dashboard/  # Statistics
│   │   └── matches/    # Manage All Matches (Table View)
│
├── layout.tsx          # Root Layout (Providers, Fonts)
└── middleware.ts       # Role-based Protection


### 🔐 Security & Access Rules
1. Middleware Protection:
- Check user's role via Supabase Auth.
- If user.role !== 'admin' tries to access /admin/*, redirect to home (/).

2. Hybrid UI Control:
- Inside match/[id], implement Conditional Rendering.
- If user.role === 'admin', render specific admin buttons ("Edit Match", "Copy Text").

--
## 5. Database Schema (Supabase Draft)
profiles (Users)
```
Column	Type	Description
id	UUID (PK)	Supabase Auth User ID
email	Text	User Email
full_name	Text	Display Name (Global friendly)
position	Enum	'FW', 'DF', 'G'
preferred_lang	Enum	'ko', 'en' (For Notifications)
role	Enum	'user', 'admin'
```

matches (Games)
```
Column	Type	Description
id	UUID (PK)	
rink_id	UUID (FK)	Reference to rinks
start_time	Timestamp	Game Start Time
fee	Integer	Cost per person
max_fw	Integer	Max Forwards
max_df	Integer	Max Defenders
max_g	Integer	Max Goalies
status	Enum	'open', 'closed', 'canceled'
description	Text	Host's notice
```

participants (Roster)
```
Column	Type	Description
id	UUID (PK)	
match_id	UUID (FK)	
user_id	UUID (FK)	
position	Enum	Applied Position (FW/DF/G)
status	Enum	'applied', 'confirmed', 'waiting', 'canceled'
payment_status	Boolean	true if paid
team_color	Enum	'Black', 'White', null
```

rinks (Venues)
```
Column	Type	Description
id	UUID (PK)	
name_ko	Text	e.g. "제니스 아이스링크"
name_en	Text	e.g. "Zenith Ice Rink"
map_url	Text	Naver/Google Map Link
```

### 6. Development Roadmap
#### 1: Foundation
- Project Init (Next.js + next-intl + Shadcn).
- Supabase Setup (Schema Apply & Auth Integration).

#### 2: Core Logic
- User Auth & Profile Implementation.
- Match List & Detail UI (with i18n support).

#### 3: Interaction & Admin
- Join Logic (Position Check & Capacity Limit).
- Admin Dashboard & "Smart Share" Text Generator.

#### 4: Polish & Deploy
- SEO & Dynamic OG Image (Open Graph).
- Final QA & Vercel Deployment.