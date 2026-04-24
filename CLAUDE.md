# Power Play — Claude Code 하네스

## 하네스: Power Play 통합 개발

**목표:** 아이스하키 동호회 경기 운영 플랫폼(Power Play)의 신기능 개발·개선·QA를 기획→구현→검증→커밋 준비까지 하나의 파이프라인으로 처리한다.

**트리거:**
- Power Play 신기능·개선·버그수정·로드맵(P0/P1) 작업 요청 시 `powerplay-feature-dev` 스킬 사용.
- 코드베이스 감사·회귀 확인·PR 전 최종 체크 등 **QA만 단독**으로 필요할 때는 `powerplay-qa-audit` 스킬 사용.
- 단순 질문(코드 설명, 특정 파일 찾기 등)은 스킬 없이 직접 응답 가능.

**핵심 원칙 (하네스 공통):**
- `powerplay-context` 스킬에 담긴 도메인 규약(KST, soft delete, role=user/admin/superuser, RLS, i18n scope 등)을 작업 전 반드시 확인.
- 도메인 판단(역할 정책, 환경 분류, 피처 우선순위 등)이 애매하면 **추정하지 말고 사용자에게 질문**.
- 중간 산출물은 `_workspace/` 에 쌓이며 git에 올리지 않는다.
- `AGENTS.md` / `.agent/` (Codex용) 는 **참고 자료**. Claude Code는 `.claude/` 하위가 1차 소스.

**참고 자산:**
- 기존 Codex용 가이드: `.agent/skills/*`, `AGENTS.md`, `.agent/implementation/*` — 도메인 지식 참고용.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-24 | 초기 하네스 구성 | 전체 (agents 5, skills 7) | 신규 구축 — 신기능 통합 개발 + QA/회귀 감사 자동화 |
