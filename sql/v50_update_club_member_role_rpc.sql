-- v50_update_club_member_role_rpc.sql

-- 1. Drop the problematic RLS policies
DROP POLICY IF EXISTS "Superusers can update club memberships" ON club_memberships;
DROP POLICY IF EXISTS "Superusers can delete club memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club admins can update club memberships" ON club_memberships;
DROP POLICY IF EXISTS "Club admins can delete club memberships" ON club_memberships;

-- 2. Create RPC for updating role
CREATE OR REPLACE FUNCTION public.update_club_member_role(
    p_club_id UUID,
    p_target_user_id UUID,
    p_new_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_superuser BOOLEAN;
    v_is_admin BOOLEAN;
    v_admin_count INT;
    v_target_role public.club_role;
BEGIN
    -- Check if caller is superuser
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'superuser'
    ) INTO v_is_superuser;

    -- Check if caller is admin of the club
    SELECT EXISTS (
        SELECT 1 FROM club_memberships
        WHERE club_id = p_club_id AND user_id = auth.uid() AND role = 'admin'::public.club_role
    ) INTO v_is_admin;

    IF NOT v_is_superuser AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- If downgrading to member, check if they are the last admin
    IF p_new_role = 'member' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM club_memberships
        WHERE club_id = p_club_id AND role = 'admin'::public.club_role;

        IF v_admin_count = 1 THEN
            SELECT role INTO v_target_role
            FROM club_memberships
            WHERE club_id = p_club_id AND user_id = p_target_user_id;

            IF v_target_role = 'admin'::public.club_role THEN
                RAISE EXCEPTION '마지막 운영진은 일반 멤버로 내릴 수 없습니다.';
            END IF;
        END IF;
    END IF;

    -- Update the role
    UPDATE club_memberships
    SET role = p_new_role::public.club_role
    WHERE club_id = p_club_id AND user_id = p_target_user_id;
END;
$$;

-- 3. Create RPC for removing member
CREATE OR REPLACE FUNCTION public.remove_club_member(
    p_club_id UUID,
    p_target_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_superuser BOOLEAN;
    v_is_admin BOOLEAN;
    v_admin_count INT;
    v_target_role public.club_role;
BEGIN
    -- Check if caller is superuser
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'superuser'
    ) INTO v_is_superuser;

    -- Check if caller is admin of the club
    SELECT EXISTS (
        SELECT 1 FROM club_memberships
        WHERE club_id = p_club_id AND user_id = auth.uid() AND role = 'admin'::public.club_role
    ) INTO v_is_admin;

    IF NOT v_is_superuser AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Cannot remove the last admin
    SELECT COUNT(*) INTO v_admin_count
    FROM club_memberships
    WHERE club_id = p_club_id AND role = 'admin'::public.club_role;

    IF v_admin_count = 1 THEN
        SELECT role INTO v_target_role
        FROM club_memberships
        WHERE club_id = p_club_id AND user_id = p_target_user_id;

        IF v_target_role = 'admin'::public.club_role THEN
            RAISE EXCEPTION '마지막 운영진은 내보낼 수 없습니다.';
        END IF;
    END IF;

    -- Delete the membership
    DELETE FROM club_memberships
    WHERE club_id = p_club_id AND user_id = p_target_user_id;
END;
$$;
