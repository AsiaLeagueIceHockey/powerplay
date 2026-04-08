# Deep Interview Spec — Tamagotchi DAU/Push Engagement

## Metadata
- Profile: standard
- Rounds: 6
- Final ambiguity: 18%
- Threshold: 20%
- Context type: brownfield
- Transcript: `.omx/interviews/tamagotchi-dau-push-engagement-20260406T151431Z.md`
- Context snapshot: `.omx/context/tamagotchi-dau-push-engagement-20260406T151431Z.md`

## Clarity breakdown
| Dimension | Score |
| --- | --- |
| Intent | 0.72 |
| Outcome | 0.86 |
| Scope | 0.88 |
| Constraints | 0.90 |
| Success | 0.74 |
| Context | 0.82 |

Readiness gates:
- Non-goals: explicit
- Decision Boundaries: explicit
- Pressure pass: complete

## Intent
Power Play에 게임다운 감정적 재미를 얹어서, 유저가 “오늘도 한 번 들어가 볼까?”라는 가벼운 습관을 만들고 브랜드에 대한 호감/재미 인식을 강화한다.

## Desired outcome
- 유저가 하루 1회 정도는 자발적으로 미니게임 진입
- 마이페이지 안에서 Power Play의 고유한 하키 감성을 느끼는 경험 제공
- 푸시 알림은 이 습관 루프를 보조하는 수단으로 사용

## In scope (v1)
- 마이페이지 내 별도 진입점에서 접근 가능한 전용 다마고치 페이지
- time-delta 기반 상태 계산 (`현재 시각 - 마지막 접속/행동 시각`)
- 가벼운 방치형 상태 저하: 에너지/컨디션만 조금 감소, 쉽게 회복 가능
- 하루 방문 시 기본 루프:
  1. 접속
  2. 상태 확인
  3. 먹이기 실행
  4. 훈련하기 실행
  5. 애니메이션/멘트 확인 후 종료
- 훈련하기는 하키 테마 로테이션 콘텐츠 포함
  - 예: 스탑 레슨, 슈팅 레슨, 포지션 훈련, 체력 훈련, 스케이팅 훈련
- 먹이기도 훈련 결과/상황에 따라 특식 같은 변주 가능
- 에셋 전 단계 placeholder UI
  - 픽셀 사각형 + CSS 둥둥 애니메이션
- 액션 후 8시간 뒤 리마인드 푸시 “best-effort” 예약

## Out-of-scope / Non-goals (v1)
- 다른 유저와의 경쟁, 랭킹, 소셜 비교
- 여러 캐릭터 수집/육성
- Power Play 포인트/매치/클럽과의 강한 시스템 연동
- 죽음, 리셋, 강한 스트레스성 패널티
- 고빈도 플레이를 전제한 복잡한 게임성
- 완전 보장형 예약 푸시 인프라

## Decision boundaries (what OMX may decide without confirmation)
- 구체적인 DB 스키마 명세
- 상태 수치 이름과 범위(예: energy, condition, mood 등)
- 훈련/특식 로테이션의 초기 데이터 구조
- placeholder UI 레이아웃/카피 세부 형태
- best-effort delayed push의 내부 구현 방식
  - 단, strict scheduler 도입은 v1 요구사항이 아님

## Constraints
- 현재 Next.js + Supabase + web push 구조 안에 자연스럽게 녹아들어야 함
- public/user 기능이므로 KR/EN i18n 필요
- SQL migration은 `sql/v{next}_{description}.sql` 형식 필요
- 푸시는 v1에서 strict guarantee가 아니라 best-effort면 충분
- 방치 패널티는 가벼워야 하며, 쉽게 회복 가능해야 함
- 하루 1회 습관형 설계여야 하며 과도한 체류 압박은 피해야 함

## Testable acceptance criteria
1. 로그인 유저는 마이페이지에서 다마고치 전용 진입점을 볼 수 있다.
2. 다마고치 페이지 진입 시 현재 상태가 마지막 접속/행동 시점 대비 time-delta 계산으로 반영된다.
3. 유저는 한 방문에서 먹이기와 훈련하기 두 액션을 모두 실행할 수 있다.
4. 훈련하기는 하키 테마 로테이션 콘텐츠를 보여준다.
5. 액션 후 캐릭터 반응(애니메이션/멘트)이 표시된다.
6. 하루를 놓쳐도 캐릭터는 심하게 망가지지 않고, 에너지/컨디션 정도만 소폭 낮아진다.
7. 액션 후 리마인드 알림 의도가 저장되거나 예약되어, v1 허용 범위 내 best-effort 8시간 뒤 푸시 재방문 유도가 가능하다.
8. 알림 권한이 없거나 구독이 없는 유저도 핵심 게임 루프는 정상 동작한다.
9. KR/EN 텍스트가 모두 제공된다.

## Assumptions exposed + resolutions
- Assumption: 성공은 체류시간이나 고빈도 재방문일 수 있다.
  - Resolution: 아니다. 핵심은 “하루 1번만 들어와도 성공”이다.
- Assumption: 예약 푸시는 정확한 스케줄 보장이 필요하다.
  - Resolution: 아니다. v1은 best-effort면 충분하다.
- Assumption: 방치형이면 강한 패널티가 있어야 리텐션이 오른다.
  - Resolution: 아니다. v1은 가벼운 방치형으로 간다.
- Assumption: v1부터 여러 시스템 연동이 필요하다.
  - Resolution: 아니다. v1은 작은 습관 루프 중심이다.

## Pressure-pass findings
- Revisited answer: “매일 접속 습관 형성 + 재미”
- Challenge: measurable/behavioral follow-up requested
- Refined result: “유저가 하루 1번만 들어와도 성공”
- Impact: downstream planning can optimize for a lightweight once-daily loop rather than a heavier engagement system.

## Brownfield evidence vs inference
### Evidence from repo
- `src/app/[locale]/(public)/mypage/page.tsx` already hosts repeat-visit surfaces and is the natural entry point for a new MyPage feature.
- `src/app/[locale]/mypage/fortune/page.tsx`, `src/app/actions/fortune.ts`, `src/components/daily-hockey-fortune-banner.tsx`, and `sql/v49_daily_hockey_fortunes.sql` provide a precedent for a small gamified daily-return feature with per-user persisted state.
- `src/app/actions/push.ts` supports immediate push sending and notification logging but does not include delayed scheduling infrastructure.
- `src/components/notification-status.tsx` and `src/components/push-manager.tsx` show an existing opt-in/registration flow for push.

### Inference
- A tamagotchi feature can likely reuse the “fortune” pattern structurally: MyPage entry banner/card + dedicated detail page + per-user daily/game state table.
- Best-effort delayed push likely requires a queued-intent table and opportunistic processing, unless planning later approves cron/Edge scheduling.

## Technical context findings
- Natural product surface: MyPage
- Natural implementation precedent: daily hockey fortune
- Major architecture gap discovered during interview: no existing delayed push scheduler/queue
- Major design risk reduced by interview: avoiding a stress-heavy pet-death loop in favor of light habit formation
- Expected new artifact types in planning:
  - one or more new SQL tables for pet state/action/reminder intent
  - new MyPage entry UI and dedicated page
  - new server actions for state load and action application
  - optional notification queue/best-effort dispatcher mechanism

## Open planning risks to handle in `$ralplan`
1. Define exact state model: whether “energy/condition/mood” are 2 or 3 dimensions and their decay formulas.
2. Define idempotency rules: how often feed/train can run per day and how duplicate taps/retries are handled.
3. Define delayed-push strategy: queue table + opportunistic dispatch vs scheduled infrastructure.
4. Define content authoring model for rotating hockey training and special meals.
5. Define measurement plan: how to judge “하루 1회 습관” in analytics without overfitting to vanity metrics.
6. Define fallback UX when push permission is denied.

## Condensed transcript
- Success priority: daily habit + fun brand experience
- Core behavior: one daily return is enough
- Non-goals: most heavy game/platform integrations excluded from v1
- Push reliability: best-effort acceptable
- Minimal loop: status check + feed + training + reaction
- Flavor: hockey-themed rotating trainings and occasional special meals
- Neglect model: light, forgiving decay
