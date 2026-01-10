# 🗺 Power Play - Development Roadmap

> **현재 상태:** Phase 2 진행 중  
> **예상 MVP 완료:** Phase 3 완료 시점

---

## 📍 현재 위치

```
Phase 1: Foundation ████████████████████ 100%
Phase 2: Core Logic  ████████████████░░░░  80%
Phase 3: Admin       ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Polish      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 🔄 Phase 2: Core Logic (진행 중)

### 남은 작업

#### 2.1 Admin 보호 및 접근 제어
- [ ] Middleware에 `/admin` 경로 보호 로직 추가
- [ ] 관리자 권한 확인 후 리다이렉트 처리
- [ ] 비관리자 접근 시 에러 페이지 또는 홈으로 이동

#### 2.2 마이페이지 기능
- [ ] `/mypage` 페이지 생성
- [ ] 내가 신청한 경기 목록 표시
- [ ] 참가 상태 (신청/확정/대기) 표시
- [ ] 입금 상태 표시

---

## 🛠 Phase 3: Admin & Interaction

### 3.1 관리자 대시보드

#### 경기 관리
- [ ] 경기 목록 테이블 뷰 (`/admin/matches`)
- [ ] 경기 생성 폼 (`/admin/matches/new`)
- [ ] 경기 수정 페이지 (`/admin/matches/[id]/edit`)
- [ ] 경기 상태 변경 (모집중 → 마감 → 취소)

#### 참가자 관리
- [ ] 참가자 목록 테이블
- [ ] 입금 확인 토글 (Unpaid ↔ Paid)
- [ ] 참가 상태 변경 (신청 → 확정 / 대기)

#### 링크 관리
- [ ] 아이스링크 CRUD (`/admin/rinks`)

### 3.2 Smart Share (카카오톡 공유 최적화)

#### 텍스트 공지 생성
- [ ] "Copy for Kakao" 버튼: 한국어 공지 생성
- [ ] "Copy for Global" 버튼: 영/한 병기 공지 생성
- [ ] 클립보드 복사 기능
- [ ] 공지 템플릿 포맷:
  ```
  🏒 파워플레이 경기 안내
  📅 2026년 1월 10일 (금) 20:00
  📍 제니스 아이스링크
  💰 참가비: 30,000원
  
  ⚡️ 잔여석
  FW: 3/8 | DF: 2/4 | G: 1/2
  
  🔗 신청하기: https://powerplay.app/match/abc123
  ```

### 3.3 Hybrid Admin UI (중요)
- [ ] 경기 상세 페이지에서 관리자 전용 버튼 노출
  - [ ] "수정" 버튼
  - [ ] "마감/열기" 버튼
  - [ ] "텍스트 복사" 버튼
- [ ] 참가자 목록에서 입금 토글 버튼 (관리자만)

---

## 🎨 Phase 4: Polish & Deploy

### 4.1 SEO & Meta

#### Open Graph 이미지
- [ ] 동적 OG 이미지 생성 (`/api/og`)
- [ ] 경기 정보가 포함된 미리보기 이미지
- [ ] 카카오톡 미리보기 최적화

#### Meta 태그
- [ ] 페이지별 title, description 설정
- [ ] robots.txt, sitemap.xml 생성

### 4.2 UI/UX 개선

#### 반응형 디자인
- [ ] 모바일 최적화
- [ ] 태블릿 레이아웃

#### 사용자 경험
- [ ] 로딩 상태 (Skeleton UI)
- [ ] 에러 핸들링 및 토스트 메시지
- [ ] 폼 유효성 검사 강화

### 4.3 Deployment

#### Vercel 배포
- [ ] 환경 변수 설정 (Production)
- [ ] 도메인 연결
- [ ] CI/CD 파이프라인

#### 최종 QA
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트
- [ ] 성능 최적화 (Core Web Vitals)

---

## 🚀 향후 확장 기능 (Post-MVP)

### V2 Features
- [ ] OAuth 로그인 (Google, Kakao)
- [ ] 푸시 알림 (경기 D-1 리마인더)
- [ ] 팀 밸런싱 UI (Drag & Drop)
- [ ] 통계 대시보드 (참가율, 수익 등)

### V3 Features
- [ ] 결제 시스템 연동 (토스페이먼츠)
- [ ] 정기 경기 자동 생성
- [ ] 게스트 커뮤니티/게시판

---

## 📊 우선순위 매트릭스

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Admin 경로 보호 | High | Low | 🔴 즉시 |
| 경기 생성 폼 | High | Medium | 🔴 즉시 |
| 입금 확인 토글 | High | Low | 🔴 즉시 |
| Smart Share | High | Medium | 🟡 다음 |
| 마이페이지 | Medium | Low | 🟡 다음 |
| OG 이미지 | Medium | High | 🟢 나중 |
| 팀 밸런싱 | Low | High | 🟢 나중 |

---

## 📝 개발 참고 사항

### 파일 위치 컨벤션
- **Pages**: `src/app/[locale]/(public|admin)/`
- **Components**: `src/components/`
- **Server Actions**: `src/app/actions/`
- **i18n Messages**: `messages/{ko,en}.json`

### 네이밍 컨벤션
- Components: PascalCase (`MatchCard.tsx`)
- Actions: camelCase (`getMatches()`)
- Routes: kebab-case (`/match/[id]`)

### 관련 문서
- [PROJECT_CONTEXT.md](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/PROJECT_CONTEXT.md) - 현재 상태
- [README.md](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/README.md) - 전체 기획
- [schema.sql](file:///Users/joelonsw/Desktop/ASIALEAGUE/powerplay/schema.sql) - DB 스키마
