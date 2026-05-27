import { createClient } from "@/lib/supabase/server";
import { getParentPostDetail, checkIsApprovedParentOrSuperUser } from "@/app/actions/parent";
import { generateRandomNickname } from "@/lib/nickname";
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
  const isAllowed = await checkIsApprovedParentOrSuperUser();
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

  if (profile && !profile.parent_nickname) {
    const newNickname = generateRandomNickname();
    await supabase
      .from("profiles")
      .update({ parent_nickname: newNickname })
      .eq("id", user.id);
    profile.parent_nickname = newNickname;
  }

  const isSuperUser = profile?.role === "superuser";

  return (
    <PostDetailClient
      locale={locale}
      user={user}
      userProfile={profile}
      isSuperUser={isSuperUser}
      initialPost={post}
      initialComments={comments}
    />
  );
}
