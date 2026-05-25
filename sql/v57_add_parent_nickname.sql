-- v57_add_parent_nickname.sql
-- profiles 테이블에 학부모용 닉네임 컬럼 추가

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_nickname TEXT;

COMMENT ON COLUMN public.profiles.parent_nickname IS '학부모 전용 게시판에서 사용할 필명 (닉네임)';
