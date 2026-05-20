import { createClient } from "@/lib/supabase/server";
import { getParentPostDetail, checkIsApprovedParentOrAdmin } from "@/app/actions/parent";
import { PostDetailClient } from "@/components/post-detail-client";
import { redirect } from "next/navigation";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // 2. Parent status check
  const isAllowed = await checkIsApprovedParentOrAdmin();
  if (!isAllowed) {
    redirect(`/${locale}/youth`);
  }

  // 3. Fetch details
  const { post, comments } = await getParentPostDetail(id);
  if (!post) {
    redirect(`/${locale}/youth`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, parent_nickname, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = ["admin", "superuser"].includes(profile?.role ?? "");

  return (
    <PostDetailClient
      locale={locale}
      user={user}
      userProfile={profile}
      isAdmin={isAdmin}
      initialPost={post}
      initialComments={comments}
    />
  );
}
