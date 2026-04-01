-- =============================================
-- v26_add_team_match_type.sql
-- 팀 매치 기능을 위한 match_type enum 값 추가
-- =============================================

-- 1. match_type enum에 'team_match' 값 추가
ALTER TYPE match_type ADD VALUE 'team_match';

-- 2. 타입 코멘트 업데이트
COMMENT ON TYPE match_type IS 'Type of match: training (practice), game (scrimmage), or team_match (team vs team matching)';
