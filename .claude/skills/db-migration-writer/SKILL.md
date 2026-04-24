---
name: db-migration-writer
description: Power Play의 Supabase(PostgreSQL) 스키마 마이그레이션 파일(`sql/v{N}_*.sql`)을 작성할 때 사용. RLS 정책 템플릿, SECURITY DEFINER RPC 패턴, soft delete 규약, enum 2단계 확장, 롤백 작성법, 버전 번호 컨벤션을 담는다. 새 테이블 추가·컬럼 변경·권한 정책·RPC 함수 등 SQL 마이그레이션을 만들거나 수정·검토·롤백 작성이 필요할 때 반드시 트리거한다.
---

# DB Migration Writer — Power Play SQL 마이그레이션

이 스킬은 `db-architect` 에이전트가 주로 사용한다. 다른 에이전트도 SQL을 건드릴 때 동일한 규약을 따른다.

## 1. 파일명 규약

- 경로: `sql/v{N+1}_{snake_case_description}.sql`
- `N+1` = 현재 `sql/` 디렉토리에서 `v*.sql` 중 최대 숫자 + 1
- 중복 번호 금지. 같은 번호로 두 파일 만들지 말 것 (과거에 실수로 발생한 사례 존재 — `v35_lounge_daily_metrics.sql` + `v35_lounge_location_maps.sql` 처럼 같은 번호 중복은 피해야 함).
- description은 간결한 snake_case (예: `add_match_duration`, `fix_push_policy`)

## 2. 기본 템플릿

```sql
-- sql/v{N}_{desc}.sql
-- Purpose: <한 줄 설명>
-- Rollback: <롤백 방법 또는 rollback 파일 참조>

BEGIN;

-- 1. 스키마 변경
ALTER TABLE matches ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- 2. RLS (새 테이블이면 필수)
-- ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- 3. 정책
-- CREATE POLICY ...

-- 4. 인덱스
-- CREATE INDEX IF NOT EXISTS ...

-- 5. 코멘트
COMMENT ON COLUMN matches.duration_minutes IS '경기 진행 시간(분)';

COMMIT;
```

## 3. RLS 정책 표준 패턴

### 3.1 유저가 자기 데이터만 접근
```sql
CREATE POLICY "Users can view own rows"
  ON public.<table>
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rows"
  ON public.<table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3.2 admin + superuser 모두 통과
```sql
CREATE POLICY "Admins manage all"
  ON public.<table>
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superuser')
    )
  );
```
**주의**: admin만 쓰고 superuser를 빠트리면 superuser가 기능을 잃는다. `IN ('admin','superuser')` 패턴을 기본값으로.

### 3.3 공개 읽기 + 인증 쓰기
```sql
CREATE POLICY "Public read" ON public.<table>
  FOR SELECT USING (true);

CREATE POLICY "Auth insert" ON public.<table>
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## 4. SECURITY DEFINER RPC

RLS로는 해결 안 되는 교차 사용자 조회(예: "A가 B에게 알림 보내기 위해 B의 토큰 필요") 시 사용한다. **`SUPABASE_SERVICE_ROLE_KEY`를 앱 코드에서 쓰지 말 것.**

### 4.1 템플릿
```sql
CREATE OR REPLACE FUNCTION public.get_user_push_tokens(target_user_id UUID)
RETURNS TABLE (endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE sql
SECURITY DEFINER
-- 아주 좁은 search_path로 고정
SET search_path = public, pg_temp
AS $$
  SELECT endpoint, p256dh, auth
  FROM push_subscriptions
  WHERE user_id = target_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_user_push_tokens(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_push_tokens(UUID) TO authenticated;
```

### 4.2 필수 체크
- 반환 컬럼은 **최소 필요 집합만**. `SELECT *` 금지.
- `SET search_path = public, pg_temp`로 SQL injection via schema 방지.
- 파라미터 타입 명시.
- `authenticated` 롤에만 EXECUTE 부여 (익명 호출 차단).

## 5. Enum 확장은 2단계

PostgreSQL은 같은 트랜잭션에서 `ALTER TYPE ... ADD VALUE` 후 즉시 사용이 막혀 있다.

### 잘못된 예 (실패)
```sql
BEGIN;
ALTER TYPE match_type ADD VALUE 'team';
UPDATE matches SET type = 'team' WHERE ...;  -- ERROR
COMMIT;
```

### 올바른 패턴 (과거 v8/v9 분리 사례)
```sql
-- sql/v{N}_add_enum_value.sql (커밋 1)
ALTER TYPE match_type ADD VALUE IF NOT EXISTS 'team';
```

```sql
-- sql/v{N+1}_use_enum_value.sql (커밋 2)
UPDATE matches SET type = 'team' WHERE ...;
```

두 파일을 별도 커밋·별도 배포로 분리한다.

## 6. Soft Delete 패턴

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON profiles(deleted_at) WHERE deleted_at IS NULL;
```

조회 시 `WHERE deleted_at IS NULL` 조건을 모든 RLS SELECT 정책에 포함하는 게 안전하다.

## 7. 롤백

파괴적 변경(DROP COLUMN/TABLE, 타입 변경)은 롤백 계획 필수:

- 간단한 경우: 동일 파일 하단에 주석으로 rollback 문을 남긴다.
- 복잡한 경우: `sql/rollback_v{N}_to_v{M}.sql` 별도 생성 (기존 `rollback_v23_to_v25.sql` 참고).

## 8. 배포 전 체크리스트

작업 종료 시 `_workspace/02_db_report.md` 하단에 다음 체크를 포함:

- [ ] 파일명 `sql/v{다음번호}_*.sql` 맞는가
- [ ] RLS 활성화 및 정책 추가 (새 테이블 경우)
- [ ] admin 권한 체크에 `superuser` 포함
- [ ] enum 변경은 2단계로 분리
- [ ] SECURITY DEFINER 함수는 search_path 고정 + 권한 REVOKE/GRANT
- [ ] 롤백 방법 문서화
- [ ] 기존 `src/` 에서 깨질 수 있는 쿼리 식별 (grep 수행)

## 9. 참고 파일

기존 마이그레이션에서 패턴을 재활용한다:

- RLS 기본: `sql/v14_fix_club_post_rls.sql`, `sql/v17_fix_push_rls.sql`
- SECURITY DEFINER RPC: `sql/v18_secure_push_rpc.sql`, `sql/v42_superuser_chat_monitoring_rpc.sql`
- 롤백: `sql/rollback_v23_to_v25.sql`
- 포인트 시스템 (2단계 enum): `sql/v8_schema_points_step1.sql` + `sql/v9_schema_points_step2.sql`
