---
name: powerplay-feature-dev
description: Power Play 신기능·개선·버그수정을 기획→구현→QA→커밋 준비까지 한 번에 처리하는 통합 개발 오케스트레이터. planner·db-architect·code-builder·i18n-steward·qa-auditor 5개 에이전트를 파이프라인+팀 하이브리드로 조율한다. Power Play 관련 "신기능 개발", "피처 추가", "기능 구현", "로드맵 작업", "P0/P1 이슈", "반복 경기 템플릿", "대기자 승격" 등 요청 시 반드시 트리거한다. **후속·재실행 지원**: "다시 실행", "재실행", "업데이트", "수정", "보완", "이전 결과 기반으로", "QA만 다시", "DB만 다시"도 이 스킬로 처리한다.
---

# Power Play Feature Dev — 통합 개발 오케스트레이터

신기능·개선·버그수정을 **기획→구현→QA→커밋 준비** 파이프라인으로 수행한다. 실행 모드는 **하이브리드**: Phase별로 서브/팀을 섞어 사용.

## 실행 모드 요약

| Phase | 모드 | 이유 |
|-------|------|------|
| 0 | 오케스트레이터 직접 | 컨텍스트 결정 |
| 1 | 서브 (planner 단독) | 기획은 단일 의사결정 |
| 2 | 에이전트 팀 (db + code + i18n) | 상호 참조·조율 필요 |
| 3 | 서브 (qa-auditor 단독) | 독립 검증 |
| 4 | 오케스트레이터 직접 | 커밋 메시지·PR 문서 |

**모든 Agent 호출은 `model: "opus"` 로 한다.**

## Phase 0 — 컨텍스트 확인

1. `_workspace/` 디렉토리 존재 여부 확인.
2. 분기:
   - **초기 실행**: `_workspace/` 없음 → 생성 후 Phase 1로.
   - **부분 재실행**: `_workspace/` 있고 사용자가 "QA만 다시", "i18n만 보완" 등 특정 단계 지정 → 해당 Phase만 실행. 다른 산출물은 그대로 유지.
   - **새 실행**: 새 피처 요청이고 기존 산출물이 관련 없음 → 기존 `_workspace/` 를 `_workspace_prev/{YYYYMMDD_HHMM}/` 로 이동한 뒤 새로 시작.
3. `powerplay-context` 스킬을 읽어 프로젝트 규약을 컨텍스트에 로드.

## Phase 1 — 기획 (서브 모드)

**호출:**
```
Agent(
  subagent_type: "planner",
  model: "opus",
  description: "기획 수립",
  prompt: "사용자 요청: {원문}\n\n산출: _workspace/01_plan.md (템플릿은 에이전트 정의 참조)"
)
```

**종료 조건:** `_workspace/01_plan.md` 생성. `## 6. 작업 분할` 섹션이 비어있지 않고 `## 3. DB 변경`/`## 4. i18n 변경` 여부가 명시됨.

**실패 처리:** planner가 `## 7. 오픈 이슈` 에 사용자 확인 항목을 남겼으면 사용자에게 그대로 전달하고 멈춘다. 추정으로 계속 진행 금지.

## Phase 2 — 구현 (에이전트 팀 모드)

계획의 DB/i18n 플래그를 읽어 팀 구성을 결정한다.

### 2.1 팀 구성
- DB 변경 필요: `[db-architect, code-builder, i18n-steward]` (i18n 불필요 시 i18n-steward 제외)
- DB 변경 불필요: `[code-builder, i18n-steward]` (i18n 불필요 시 code-builder 단독)

**1인 팀이면 서브 에이전트로 축소** (팀 통신 오버헤드 방지).

### 2.2 팀 호출 예시
```
TeamCreate(
  team_name: "powerplay-build",
  members: ["db-architect", "code-builder", "i18n-steward"],
  shared_task_list: true
)

TaskCreate(
  subject: "sql/v{N}_*.sql 작성",
  owner: "db-architect",
  description: "_workspace/01_plan.md의 DB 변경 섹션 반영"
)
TaskCreate(
  subject: "src/app/... 및 컴포넌트 구현",
  owner: "code-builder",
  description: "db-architect 결과 대기 후 착수. 완료 시 i18n-steward에 새 키 목록 전달"
)
TaskCreate(
  subject: "messages/{ko,en}.json 동기화",
  owner: "i18n-steward",
  description: "code-builder의 새 키 목록 수신 후 작성. 하드코딩 한국어 전면 감사"
)
```

각 Agent 호출 시 `model: "opus"` 전달.

### 2.3 데이터 전달
- **태스크 기반**: 진행 추적 + 작업 요청
- **메시지 기반**: shape 변경·키 목록 실시간 통지 (`SendMessage`)
- **파일 기반**: `_workspace/02_db_report.md`, `03_build_report.md`, `04_i18n_report.md` 누적

### 2.4 종료 조건
세 보고서 파일이 모두 존재하고 각자 `## 미해결 이슈` 가 없거나 사용자 승인 필요 항목만 남아 있음.

## Phase 3 — QA (서브 모드)

**호출:**
```
Agent(
  subagent_type: "qa-auditor",
  model: "opus",
  description: "경계면 QA 감사",
  prompt: "Phase 2 결과물 감사. boundary-audit 스킬 규약에 따라 _workspace/05_qa_report.md 작성. typecheck/vitest 실행 필수."
)
```

### 3.1 결과 처리
- `GO` → Phase 4 진행
- `NEEDS FIX` → QA 보고서의 `NEEDS FIX` 섹션을 읽고, 해당 영역 에이전트를 재호출:
  - 코드 이슈 → `code-builder`
  - DB 이슈 → `db-architect`
  - i18n 이슈 → `i18n-steward`
  - 재호출 시 `_workspace/05_qa_report.md` 경로와 구체 FIX 항목을 prompt에 포함.
  - 수정 완료 후 qa-auditor 재호출. 최대 2회 루프. 3회 이상 필요하면 사용자에게 에스컬레이션.
- `NO-GO` → 사용자 에스컬레이션 (설계 결함 가능성)

## Phase 4 — 커밋 준비 (오케스트레이터 직접)

1. `git status`, `git diff --stat` 확인.
2. 변경 요약을 Phase 2/3 보고서에서 추출.
3. 커밋 메시지 초안 작성 (아래 규약):
   - 제목: `feat: {핵심 요약}` 또는 `fix:` / `refactor:` / `chore:` 등 기존 히스토리 스타일 따름 (현재 한국어 + 축약형 사용: `feat: wrap space`, `feat: 비로그인 audit` 등 참고)
   - 본문: Why + 주요 변경 영역. `_workspace/05_qa_report.md` 의 검증 항목 요약.
4. **사용자에게 커밋 여부 확인.** 자동 커밋 금지 — 사용자 승인 필수.
5. 승인 시 commit, 아니면 제안만.

## Phase 5 — 피드백 수집 (선택)

완료 보고 직후 사용자에게:
- "결과에서 개선할 부분이 있나요?"
- 피드백 유형에 따라 에이전트 정의/스킬/오케스트레이터 수정 (Phase 7-2 반영 경로)
- 변경은 `CLAUDE.md` 변경 이력에 기록

## 데이터 전달 프로토콜

| 경로 | 용도 |
|------|------|
| `_workspace/01_plan.md` | Phase 1 산출 — 전 Phase의 지시서 |
| `_workspace/02_db_report.md` | DB 변경 요약 |
| `_workspace/03_build_report.md` | 코드 변경 요약 + 새 i18n 키 |
| `_workspace/04_i18n_report.md` | 번역 작업 요약 |
| `_workspace/05_qa_report.md` | QA 판정 |
| `_workspace_prev/{timestamp}/` | 이전 실행 보존 |

**중간 파일은 커밋하지 않는다.** `_workspace/`, `_workspace_prev/` 는 프로젝트 `.gitignore` 에 추가해야 함 (없으면 오케스트레이터가 제안).

## 에러 핸들링

| 유형 | 전략 |
|------|------|
| planner 질문 반환 | 사용자에게 그대로 전달, 멈춤 |
| DB 변경 중 타입 충돌 | db-architect 1회 재시도. 재실패 시 사용자 에스컬레이션 |
| typecheck 실패 | code-builder 재호출, 2회 루프 한계 |
| 테스트 실패 | 실패 테스트가 기능 회귀면 code-builder, 테스트 자체 오류면 사용자 확인 |
| QA 3회 이상 NEEDS FIX | 설계 재검토 — planner 재호출 또는 사용자 에스컬레이션 |

1회 재시도 후 재실패 시 해당 결과 없이 진행하고 보고서에 누락 명시. 상충 데이터는 삭제하지 않고 출처 병기.

## 테스트 시나리오

### 정상 흐름
요청: "반복 경기 템플릿 기능 추가. 매주 같은 요일·시간·링크장에 자동 경기 생성."
1. Phase 1: planner → DB 변경 필요(`match_templates` 테이블), i18n 필요(admin/호스트가 설정), 역할 admin+superuser.
2. Phase 2: db-architect가 `sql/v{N}_match_templates.sql` 생성, code-builder가 `src/app/[locale]/(admin)/admin/templates/` 구현 + Server Action, i18n-steward가 `templateForm.*` 키 추가.
3. Phase 3: qa-auditor → GO. typecheck/test 통과. 역할 경로 확인.
4. Phase 4: 커밋 메시지 초안 → 사용자 승인 → commit.

### 에러 흐름
QA에서 NEEDS FIX: "Server Action 반환 shape이 클라이언트 훅과 불일치"
1. 오케스트레이터가 code-builder를 재호출하며 QA 보고서 인용.
2. code-builder 수정 후 qa-auditor 재호출.
3. 통과 시 Phase 4, 재실패 시 2회 루프 후 사용자 에스컬레이션.

### 부분 재실행 흐름
요청: "방금 만든 기능 QA만 다시 돌려줘."
1. Phase 0: `_workspace/` 기존 유지, 부분 재실행 분기.
2. Phase 3만 실행 (qa-auditor 호출).
3. 결과 처리 후 사용자 보고.

## 참고

- 프로젝트 규약: `powerplay-context`
- 에이전트 정의: `.claude/agents/{planner,db-architect,code-builder,i18n-steward,qa-auditor}.md`
- 독립 QA 트리거: `powerplay-qa-audit` 스킬 (Phase 3만 단독 실행)
