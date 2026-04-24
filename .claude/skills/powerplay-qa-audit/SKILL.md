---
name: powerplay-qa-audit
description: Power Play 코드베이스의 **독립 QA 감사**를 수행한다. 신기능 개발이 아닌 "현재 브랜치 검증", "최근 변경 QA", "회귀 확인", "타입·테스트·경계면 점검", "PR 전 최종 감사" 등 **QA만 단독으로** 필요할 때 사용. `qa-auditor` 에이전트를 호출해 typecheck/vitest 실행, API↔훅 shape 교차 비교, 역할(user/admin/superuser) 접근 경로 검증, KST/soft delete/enum 도메인 규약 점검을 수행한다. "QA 해줘", "검증 해줘", "감사", "audit", "회귀 확인", "릴리스 전 체크"에 반드시 트리거.
---

# Power Play QA Audit — 독립 감사 오케스트레이터

신기능 파이프라인과 무관하게 **지금 상태의 코드를 감사**한다. `powerplay-feature-dev` 의 Phase 3만 단독 실행하는 얇은 래퍼.

## Phase 0 — 감사 범위 결정

사용자 요청에서 범위 신호를 추출:

| 신호 | 범위 |
|------|------|
| "현재 브랜치", "최근 커밋" | `git diff main...HEAD` 파일 목록 |
| "특정 피처", "매치 관련" | 해당 영역 `src/app/**/match*`, `src/components/match-*` 등 grep |
| "전체" | 프로젝트 전체 (시간 소요 주의) |
| 미지정 | `git status` + `git diff` 기준 변경 영역 |

범위를 결정해 `_workspace/qa_scope.md` 에 기록 (범위 파일 경로 목록).

## Phase 1 — qa-auditor 호출

```
Agent(
  subagent_type: "qa-auditor",
  model: "opus",
  description: "독립 QA 감사",
  prompt: "감사 범위: _workspace/qa_scope.md 참조.\n\nboundary-audit 스킬의 절차에 따라:\n1. typecheck/vitest 실행\n2. 경계면 shape 교차 비교 (감사 범위 한정)\n3. 역할 경로 검증\n4. 회귀 영향 범위 탐지\n5. 도메인 규약 체크리스트 (KST, soft delete, enum 2단계, RLS, superuser⊃admin)\n\n산출: _workspace/qa_audit_report.md"
)
```

## Phase 2 — 결과 처리

1. `_workspace/qa_audit_report.md` 를 사용자에게 요약.
2. 판정:
   - `GO`: 문제 없음 요약 전달.
   - `NEEDS FIX`: FIX 항목별 권고 전달. **자동 수정 금지.**
   - `NO-GO`: 구조적 이슈 — 설계 재검토 제안.
3. 사용자가 수정 요청 시 `powerplay-feature-dev` 오케스트레이터로 위임 (부분 재실행 모드).

## 에러 핸들링

- typecheck/vitest 명령 자체가 실패하면 원인 (누락된 의존성, 환경 변수 등) 을 보고서에 기록하고 사용자에게 확인 요청.
- 변경 범위가 너무 넓어 시간이 오래 걸릴 것으로 예상되면 사용자에게 범위 축소 제안.

## 테스트 시나리오

### 정상 흐름
요청: "현재 브랜치 QA 해줘"
1. Phase 0: `git diff main...HEAD --name-only` → 변경 파일 목록.
2. Phase 1: qa-auditor 호출.
3. Phase 2: GO 판정 → 요약 보고.

### 에러 흐름
요청: "전체 QA 감사"
1. Phase 0: 범위 = 전체. 사용자에게 소요 시간 경고.
2. Phase 1: 진행. typecheck 실패 발견.
3. Phase 2: NEEDS FIX로 보고. 수정 권고 나열. `powerplay-feature-dev` 사용 안내.

## 참고

- 감사 방법론: `boundary-audit` 스킬
- 프로젝트 규약: `powerplay-context` 스킬
- 수정 필요 시: `powerplay-feature-dev` 스킬 (부분 재실행 모드)
