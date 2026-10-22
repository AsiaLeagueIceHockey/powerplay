# Known issues

알고는 있지만 아직 고치지 않은 문제를 기록한다. 해결하면 이 문서에서 지우고 커밋 메시지에 남긴다.

## 1. 원래부터 실패하는 테스트 7개

- 확인 기준: `7b0e5c9`부터 2026-10-22 `codex/design-system`까지 같은 7개가 실패한다. 식별자는 `docs/design-system-baseline.json`에도 있다.
- 디자인 시스템 작업과는 무관하다. UI 작업에서는 "새로 생긴 실패가 없는지"를 이 목록과 테스트 이름으로 비교한다(개수만 비교하지 않는다).
- 고치려면 서버 액션의 반환 형태와 mock 구조를 바꿔야 할 수 있으므로 별도 작업으로 다룬다.

| 파일 | 테스트 | 실패 내용 |
| --- | --- | --- |
| `src/app/actions/__tests__/financial-flows.test.ts` | Join Match Flow › Scenario 1: Join with sufficient points -> Confirmed & Deducted | `expected undefined to be 'confirmed'` |
| 〃 | Join Match Flow › Scenario 3: Goalie Free -> Confirmed (0 Points) | `expected undefined to be 'confirmed'` |
| 〃 | Cancel Match Flow › Scenario 1: Cancel "Waiting" status -> No Refund (The Bug Fix Check) | `expected undefined to be true` |
| 〃 | Cancel Match Flow › Scenario 2: Cancel "Pending Payment" -> No Refund | `expected undefined to be true` |
| 〃 | Cancel Match Flow › Scenario 3: Cancel Confirmed (Paid) with 100% Refund Policy | `expected undefined to be true` |
| 〃 | Waitlist Promotion Flow › Scenario: FW Cancel -> DF Waiter Promoted (Skater Pool) | mock이 `('position', ['FW', 'DF'])` 인자로 호출되지 않음 |
| `tests/unit/superuser-match-filters.test.ts` | filters by status and type | `expected [] to deeply equal ['m2']` |

## 2. 렌더링 중 DB에 쓰는 GET 경로

페이지를 열기만 해도(GET) 서버 렌더링 중에 DB 쓰기가 일어나는 곳이다. 모두 **로그인 세션이 있을 때만** 실행되고, 익명 방문에서는 실행되지 않는다(2026-10-22 정적 분석 기준). dev 서버로 검증할 때는 `CLAUDE.md`의 "검증 안전 규칙"을 따른다.

| 경로 | 호출 | 쓰기 내용 | 실행 조건 |
| --- | --- | --- | --- |
| `/[locale]/youth`, `/youth/write`, `/youth/community/[id]` | 페이지 본문 | `profiles.parent_nickname` 자동 생성 | 승인된 학부모 또는 슈퍼유저이고 닉네임이 없을 때 |
| `/[locale]/youth/community/[id]` | `getParentPostDetail` | `increment_parent_post_views` RPC (조회수 +1) | 로그인한 승인 학부모·슈퍼유저 |
| `/[locale]/mypage/matches` | `getMyMatches` | 조건에 맞는 참가 신청을 `status: "canceled"`로 변경 | 로그인 |
| `/[locale]/mypage/points/charge` | `getUserPendingMatches` | 조건에 맞는 참가 신청을 `status: "canceled"`로 변경 | 로그인 |
| `/[locale]/mypage/fortune` | `getDailyHockeyFortuneScreen` | 운세 결과 upsert, `viewed_at`·`signals` 갱신 | 로그인 |
| `/[locale]/chat/[roomId]` | `markMessagesAsRead` | 메시지 `is_read: true` | 로그인한 채팅 참여자 |
| `GET /api/cron/match-reminder` | 라우트 핸들러 | 경기 알림 발송과 로그 기록 | `x-cron-secret` 헤더가 일치할 때 |

익명 공개 화면(홈, 동호회, 링크장, 경기, 라운지, 클럽 찾기, About)은 렌더링 중 쓰기가 없다. 다만 브라우저에서 실행되는 서버 액션(투표, 라운지 노출·클릭 트래킹 등)은 POST로 나가므로 따로 막아야 한다.
