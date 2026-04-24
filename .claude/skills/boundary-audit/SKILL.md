---
name: boundary-audit
description: Power Play 변경사항의 경계면 QA 스킬. API↔훅 shape 교차 비교, Server Action 반환 타입↔클라이언트 사용 타입 일치, Supabase RPC 반환↔타입 정의↔디스트럭처링 일치, 역할(user/admin/superuser)별 접근 경로 검증, 회귀 영향 범위 탐지, `npm run typecheck`/`npm test` 실행, KST/soft delete/enum 규약 점검. 구현 직후 QA·검증·회귀 확인·감사가 필요할 때 반드시 트리거한다.
---

# Boundary Audit — Power Play QA

`qa-auditor` 에이전트가 주로 사용한다. **"경계면 교차 비교"** 가 핵심 원칙이다. 존재 확인("파일 있음") 정도로 만족하지 말고, 두 지점이 실제로 **같은 타입·같은 값**을 주고받는지 교차 검증한다.

## 1. 경계면 식별

Power Play에서 자주 버그가 터지는 경계면 5종:

### 1.1 Server Action ↔ 클라이언트 컴포넌트/훅
- `src/app/actions/*.ts` 의 반환 타입
- 호출하는 `src/components/*.tsx` 의 디스트럭처링·사용
- `.success` / `.error` / `.data` 필드 이름 불일치 다수 발생

### 1.2 Supabase 쿼리 결과 ↔ 사용 코드
- `from("matches").select(...)` 의 select 문자열과 실제 쓰는 필드 이름
- 조인 (`participants(*)`) 형태가 TypeScript 타입과 맞는지

### 1.3 SECURITY DEFINER RPC ↔ RPC 타입 정의 ↔ 호출부
- `sql/v*.sql` 의 `RETURNS TABLE (...)`
- `src/lib/supabase/types.ts` 의 RPC 반환 타입
- `supabase.rpc("...")` 호출 후 디스트럭처링

### 1.4 messages/*.json 키 ↔ useTranslations 호출
- `t("matchCard.joinButton")` 호출과 실제 JSON 키 존재 여부
- namespace 오타 빈발

### 1.5 라우트 ↔ 미들웨어 ↔ 서버 액션 권한
- `src/middleware.ts` 의 리다이렉트
- 액션 내부 `role` 체크
- RLS 정책
- **세 곳이 일치해야** 한다. 한 곳만 막혀도 다른 경로로 우회 가능.

## 2. 비교 방법 — 교차 읽기

### 2.1 단일 에이전트 재읽기 기법
- 경로 A 파일을 먼저 읽는다.
- 경로 B 파일을 따로 읽는다.
- 두 내용을 **메모리 안에서** 표로 대조하고, 차이를 보고서에 기록.
- "존재 확인"(파일이 있다)에 그치지 말고 **타입/필드명/값**까지 비교.

### 2.2 구체 절차 (Server Action ↔ 컴포넌트)
```
1. src/app/actions/X.ts 읽기 → 반환 타입 추출
2. rg "X\\(" src/components src/app --type=tsx → 호출처 찾기
3. 각 호출처의 디스트럭처링을 대조
4. 불일치 발견 시 파일:라인 + 기대 vs 실제 기록
```

## 3. 역할 경로 검증

작업 결과물의 라우트/액션마다 다음 표를 완성:

| 라우트/액션 | user 기대 | admin 기대 | superuser 기대 | 실제(코드) | 결과 |
|------------|----------|-----------|---------------|-----------|------|
| /admin/matches | 차단 | 통과 | 통과 | middleware check + action check + RLS | PASS/FAIL |

- middleware 리다이렉트, Server Action의 role 체크, RLS 정책 **세 곳**을 모두 확인.
- admin 허용만 있고 superuser 누락 시 FAIL 로 기록.

## 4. 자동 검증 스크립트

### 4.1 TypeScript
```bash
npm run typecheck
```
출력 전체를 보고서에 요약. **실패 시 PASS로 쓰지 말 것.**

### 4.2 테스트
```bash
npm test
```
기본은 vitest run. 실패 케이스 목록과 원인을 기록.

### 4.3 ESLint (선택)
```bash
npm run lint
```

### 4.4 i18n 대칭성
```bash
jq -r 'paths(scalars) | join(".")' messages/ko.json | sort > /tmp/ko
jq -r 'paths(scalars) | join(".")' messages/en.json | sort > /tmp/en
diff /tmp/ko /tmp/en
```

## 5. 회귀 영향 범위

변경한 각 함수/컴포넌트/타입에 대해:

```bash
rg "functionName\\(" src/ --type=tsx --type=ts -n
rg "<ComponentName" src/ --type=tsx -n
rg "Type(Name)?[:<]" src/ --type=ts -n
```

호출처 중 이번 변경으로 깨질 수 있는 위치를 보고서에 나열.

## 6. 도메인 규약 체크리스트

마지막에 다음을 고정으로 점검:

- [ ] **KST**: `new Date(...)` 직접 호출 부분이 있으면 KST 강제 여부 확인. 특히 datetime-local 저장 경로.
- [ ] **Soft delete**: 유저 관련 DELETE 쿼리 없음. `deleted_at` 사용.
- [ ] **Enum 2단계**: 새 enum 값이 같은 커밋에서 사용되는지 확인. 같은 트랜잭션이면 FAIL.
- [ ] **RLS**: 새 테이블에 `ENABLE ROW LEVEL SECURITY` + 정책.
- [ ] **superuser ⊃ admin**: 권한 체크에 `["admin", "superuser"].includes(role)` 패턴.
- [ ] **Server Action 파일**: `export` 는 async만. sync 헬퍼가 export 되어있지 않은지.
- [ ] **Path alias**: `@/*` 사용, 상대경로 탈출(../../..) 없음.
- [ ] **any/@ts-ignore**: grep 결과 없음.
- [ ] **i18n 누락**: public/user 영역 하드코딩 한국어 없음. ko/en 키 일치.
- [ ] **UI 가드레일**: 새 카드 `rounded-xl`, 버튼 `whitespace-nowrap`.

## 7. 보고서 포맷

`_workspace/05_qa_report.md` 작성:

```markdown
# QA Report — {피처명} / {YYYY-MM-DD}

## 0. 최종 판정
- GO / NEEDS FIX / NO-GO
- PASS: N, FAIL: M, BLOCKED: K

## 1. 자동 검증
### typecheck: PASS/FAIL
<요약>
### vitest: PASS/FAIL
<실패 테스트 목록>
### i18n diff: PASS/FAIL

## 2. 경계면 shape 비교
| A | B | 결과 | 비고 |
| ... | ... | ... | ... |

## 3. 역할 경로
<Section 3 표>

## 4. 회귀 위험
- 함수 X의 호출처: file:line (위험도)
- ...

## 5. 도메인 규약 체크
<Section 6 체크리스트 결과>

## 6. NEEDS FIX
### 6-1. <제목>
- 위치: src/.../file.ts:42
- 문제: ...
- 권고: ...
```

## 8. 행동 수칙

- **버그는 스스로 고치지 않는다.** 위치와 권고만 작성. 수정은 오케스트레이터가 code-builder/db-architect/i18n-steward 재호출로 처리.
- **환상 금지.** 실행하지 않은 검증을 실행한 척 쓰지 말 것. typecheck 실패를 "pass"로 둔갑시키는 순간 하네스가 무너진다.
- **점진적 QA.** 하나의 대형 보고서보다, 각 모듈 완성 직후 조각 보고서를 누적하는 게 품질이 좋다.

## 9. 참고

- 프로젝트 규약: `powerplay-context` 스킬
- DB 검증 기준: `db-migration-writer` 스킬
- 코드 패턴: `nextjs-patterns` 스킬
- i18n 기준: `i18n-sync` 스킬
