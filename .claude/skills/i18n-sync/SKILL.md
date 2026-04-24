---
name: i18n-sync
description: Power Play의 `messages/ko.json`↔`messages/en.json` 동기화 전문 스킬. 키 대칭 보장, 하드코딩 한국어 감지, public/user vs superuser-only 스코프 판정, ICU 복수형·변수 문법, 날짜/시간 포맷 규약을 담는다. 번역 키를 추가·수정·삭제하거나, JSX에서 한국어 리터럴을 발견하거나, 신규 페이지·컴포넌트의 텍스트를 다국어로 내보낼 때 반드시 트리거한다.
---

# i18n Sync — Power Play 번역 키 관리

`i18n-steward` 에이전트가 주로 사용한다. `next-intl` ^4.7.0 기준.

## 1. 파일 위치

- `messages/ko.json` (한국어)
- `messages/en.json` (영어)

프로젝트 루트 또는 `src/messages/` 중 현재 코드의 `next-intl` 설정을 우선한다 (`src/i18n/` 또는 `i18n.config` 확인).

## 2. 대칭성 원칙

두 파일의 **키 집합은 완전히 동일**해야 한다. 한쪽에만 존재하는 키는 런타임에 fallback되어 반대 언어 유저에게 한국어가 노출되거나 키 문자열이 날것으로 표시된다.

### 감지 방법

```bash
# 키 목록 추출 후 비교 (jq 사용)
jq -r 'paths(scalars) | join(".")' messages/ko.json | sort > /tmp/ko_keys
jq -r 'paths(scalars) | join(".")' messages/en.json | sort > /tmp/en_keys
diff /tmp/ko_keys /tmp/en_keys
```

출력이 비어야 정상.

## 3. Scope 판정

### 3.1 public/user 페이지 (EN 필수)
- 경로: `src/app/[locale]/(public)/*`
- 메인 페이지, 매치 리스트/상세, 클럽 리스트/상세, 라운지, 마이페이지, 로그인 등
- EN 번역 필수. 품질 낮은 자동번역보다 원어민 자연 표현 우선.

### 3.2 superuser 전용 페이지 (KR only 허용)
- `/admin` 내 superuser만 접근 가능한 라우트
- 하드코딩 한국어 허용. 영문화 강요하지 않음.
- 단, admin(동호회 관리자)도 볼 수 있는 화면은 3.3에 해당.

### 3.3 일반 admin 페이지 (사안별)
- 계획 문서(`_workspace/01_plan.md`) 의 역할 경로 섹션 참조
- 외국인 운영자 시나리오가 있으면 EN 필요. 없으면 KR만 OK.

## 4. 네임스페이스 규약

- camelCase 키, 의미 단위 계층화:
  ```json
  {
    "matchCard": {
      "title": "경기 제목",
      "joinButton": "참가 신청",
      "fullLabel": "마감"
    }
  }
  ```
- 같은 화면의 문구는 같은 namespace에 묶는다.
- 플랫한 긴 키(`matchCardJoinButton`) 지양. 중첩이 검색·유지에 유리.

## 5. ICU 문법

### 변수 치환
```json
{ "greeting": "{name}님 환영합니다" }
```
```json
{ "greeting": "Welcome, {name}" }
```
```tsx
t("greeting", { name: profile.full_name })
```

### 복수형
```json
{
  "applicantCount": "{count, plural, =0 {신청자 없음} one {신청자 #명} other {신청자 #명}}"
}
```
```json
{
  "applicantCount": "{count, plural, =0 {No applicants} one {# applicant} other {# applicants}}"
}
```

**주의:** 문자열 연결 (`"참가자 " + count + "명"`) 금지. 항상 ICU 변수.

## 6. 날짜/시간

- 포맷팅은 `useFormatter` 또는 `getFormatter` + `timeZone: "Asia/Seoul"` 필수
- 메시지 파일에 하드코딩된 날짜 포맷 금지 (`1월 8일 (월)` 같은 문자열 템플릿 X)
- 필요 시 포맷 프리셋을 `next-intl.config` 의 `formats` 섹션에 정의

## 7. 하드코딩 한국어 탐지

### 7.1 Grep 패턴
```bash
# JSX 안의 한국어 리터럴
rg "[가-힣]" src/app/\[locale\]/\(public\) --type=tsx -n
rg "[가-힣]" src/components --type=tsx -n | grep -v "^.*://"
```

### 7.2 예외 처리
다음은 한국어라도 번역 대상이 아닐 수 있음:
- 주석 (`// ...`)
- `console.log`, 개발 로그
- 데이터 속성 테스트 ID (`data-testid="...한국어..."` → 영어 권장)
- Sentry breadcrumb, 내부 에러 코드
- 지명·고유명사 (링크장 이름 한국어 원명) — 번역 여부 사안별

판단이 애매하면 `_workspace/04_i18n_report.md` 에 원문 위치와 함께 질문으로 남긴다.

## 8. 추가·수정 워크플로우

1. code-builder로부터 새 키 목록을 받는다 (namespace + 키 + 한국어/영어 초안)
2. 두 파일에 동시에 키를 추가. JSON 구조를 깨지 않도록 들여쓰기·쉼표 주의.
3. 기존 키와 중복·충돌 여부 검사
4. 추가 후 대칭성 diff 재확인 (Section 2)
5. 변경 요약을 `_workspace/04_i18n_report.md` 에 기록

## 9. 삭제·리팩토링

- 키 삭제 시 `useTranslations` 호출부를 모두 grep해 사용하지 않는지 확인:
  ```bash
  rg "\"matchCard\\.fullLabel\"" src/ --type=tsx --type=ts
  ```
- 키 이름 변경은 "추가(new) → 사용처 교체 → 이전 키 삭제" 3단계로 안전하게.

## 10. 작업 종료 체크

`_workspace/04_i18n_report.md`:

- [ ] ko/en 키 집합이 정확히 일치
- [ ] JSON 문법 오류 없음 (`jq . messages/*.json` 통과)
- [ ] 새 키가 적절한 namespace에 배치
- [ ] public/user 영역의 하드코딩 한국어 잔여 없음 (또는 의도적 예외 명시)
- [ ] superuser-only 화면은 영문화 강제 안 됨
- [ ] ICU 복수/변수 문법 정상
- [ ] 날짜 포맷은 formatter 사용 (메시지에 하드코딩 X)
- [ ] 불명확한 원문은 보고서에 질문으로 남김
