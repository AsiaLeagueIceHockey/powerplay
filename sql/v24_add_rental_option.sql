-- =============================================
-- v24_add_rental_option.sql
-- 장비 대여(하키 체험) 기능을 위한 컬럼 추가
-- =============================================

-- 1. Matches 테이블에 장비 대여비(rental_fee) 컬럼 추가
-- 기본값 0 (대여 없음), NULL 허용 안함
ALTER TABLE matches
ADD COLUMN rental_fee INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN matches.rental_fee IS 'Equipment rental fee (extra cost on top of entry_points)';

-- 2. Participants 테이블에 장비 대여 선택 여부(rental_opt_in) 컬럼 추가
-- 기본값 false (대여 안함), NULL 허용 안함
ALTER TABLE participants
ADD COLUMN rental_opt_in BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN participants.rental_opt_in IS 'Whether the participant opted in for equipment rental';
