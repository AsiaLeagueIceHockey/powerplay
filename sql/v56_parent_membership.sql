-- ==========================================================
-- 🏒 Power Play - v56 Parent Membership & Community Schema
-- ==========================================================

-- 1. profiles 테이블에 학부모 인증 상태 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS parent_verification_status TEXT DEFAULT 'none' 
CHECK (parent_verification_status IN ('none', 'pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.profiles.parent_verification_status IS '학부모 인증 상태 (none, pending, approved, rejected)';

-- 2. parent_applications 테이블 생성 (학부모 인증 신청서)
CREATE TABLE IF NOT EXISTS public.parent_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_name TEXT NOT NULL,
    child_birth_year INTEGER NOT NULL,
    child_club TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_applications IS '학부모 회원 인증 신청 정보';

-- 3. parent_posts 테이블 생성 (학부모 전용 커뮤니티 게시글)
CREATE TABLE IF NOT EXISTS public.parent_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_posts IS '학부모 전용 커뮤니티 게시글';

-- 4. parent_comments 테이블 생성 (학부모 전용 커뮤니티 댓글)
CREATE TABLE IF NOT EXISTS public.parent_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.parent_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_comments IS '학부모 전용 커뮤니티 댓글';

-- 5. parent_news 테이블 생성 (학부모 전용 교육/뉴스 게시판)
CREATE TABLE IF NOT EXISTS public.parent_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.parent_news IS '학부모 전용 하키 정보 및 가이드 게시글';

-- ==========================================================
-- Triggers for updated_at
-- ==========================================================
CREATE TRIGGER update_parent_applications_updated_at
    BEFORE UPDATE ON public.parent_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_posts_updated_at
    BEFORE UPDATE ON public.parent_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_comments_updated_at
    BEFORE UPDATE ON public.parent_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_news_updated_at
    BEFORE UPDATE ON public.parent_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================================
-- Row Level Security (RLS) Policies
-- ==========================================================

-- Enable RLS
ALTER TABLE public.parent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_news ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- parent_applications Policies
-- ----------------------------------------------------------

-- 유저는 본인의 신청 정보만 볼 수 있음
CREATE POLICY "Users can view own application"
    ON public.parent_applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 유저는 본인의 신청 정보만 등록할 수 있음
CREATE POLICY "Users can insert own application"
    ON public.parent_applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 유저는 본인의 신청 정보만 수정할 수 있음
CREATE POLICY "Users can update own application"
    ON public.parent_applications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 관리자/SuperUser는 모든 신청서 제어 가능
CREATE POLICY "Admins can manage all applications"
    ON public.parent_applications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- ----------------------------------------------------------
-- parent_posts Policies (학부모 게시글)
-- ----------------------------------------------------------

-- 승인된 학부모 또는 관리자만 게시글을 읽을 수 있음
CREATE POLICY "Approved parents and admins can select posts"
    ON public.parent_posts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 승인된 학부모만 게시글을 등록할 수 있음
CREATE POLICY "Approved parents can insert posts"
    ON public.parent_posts FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 작성자 본인만 게시글을 수정하거나 삭제할 수 있음
CREATE POLICY "Users can update own posts"
    ON public.parent_posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
    ON public.parent_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 관리자는 모든 게시글 삭제 가능
CREATE POLICY "Admins can delete any posts"
    ON public.parent_posts FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- ----------------------------------------------------------
-- parent_comments Policies (학부모 댓글)
-- ----------------------------------------------------------

-- 승인된 학부모 또는 관리자만 댓글을 읽을 수 있음
CREATE POLICY "Approved parents and admins can select comments"
    ON public.parent_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 승인된 학부모만 댓글을 등록할 수 있음
CREATE POLICY "Approved parents can insert comments"
    ON public.parent_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 작성자 본인만 댓글을 수정하거나 삭제할 수 있음
CREATE POLICY "Users can update own comments"
    ON public.parent_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON public.parent_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 관리자는 모든 댓글 삭제 가능
CREATE POLICY "Admins can delete any comments"
    ON public.parent_comments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- ----------------------------------------------------------
-- parent_news Policies (학부모 교육/뉴스)
-- ----------------------------------------------------------

-- 승인된 학부모 또는 관리자만 뉴스를 조회할 수 있음
CREATE POLICY "Approved parents and admins can select news"
    ON public.parent_news FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );

-- 관리자만 뉴스 관리(CRUD) 가능
CREATE POLICY "Admins can manage news"
    ON public.parent_news FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'superuser')
        )
    );


-- ==========================================================
-- Supabase Storage 설정 및 RLS (parent-posts 버킷)
-- ==========================================================

-- 버킷 등록
INSERT INTO storage.buckets (id, name, public) 
VALUES ('parent-posts', 'parent-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책: 인증되고 승인된 학부모만 파일 업로드 허용
CREATE POLICY "Allow approved parents to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'parent-posts' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.parent_verification_status = 'approved' OR profiles.role = 'admin' OR profiles.role = 'superuser')
    )
);

-- 자신이 올린 파일 삭제 허용
CREATE POLICY "Allow owners to delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'parent-posts' AND
    (owner = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'admin' OR profiles.role = 'superuser')
    ))
);
