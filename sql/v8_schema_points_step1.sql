-- =============================================
-- 🏒 Power Play - 포인트 시스템 스키마 (1/2)
-- schema_points_step1.sql
-- 
-- ⚠️ 이 파일을 먼저 실행한 후,
--    schema_points_step2.sql을 실행하세요.
-- =============================================

-- user_role에 'superuser' 추가
-- 주의: 이미 존재하면 에러 발생할 수 있음
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superuser' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'superuser';
    END IF;
END$$;

-- 포인트 거래 타입
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'point_transaction_type') THEN
        CREATE TYPE point_transaction_type AS ENUM ('charge', 'use', 'refund', 'admin_adjustment');
    END IF;
END$$;

-- 충전 요청 상태
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'charge_request_status') THEN
        CREATE TYPE charge_request_status AS ENUM ('pending', 'confirmed', 'rejected', 'canceled');
    END IF;
END$$;
