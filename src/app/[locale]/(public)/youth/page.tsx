import { createClient } from "@/lib/supabase/server";
import { getMyParentApplication, getParentPosts, getParentNewsList, ParentPost, ParentNews } from "@/app/actions/parent";
import { YouthClient } from "@/components/youth-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "youth" });
  return {
    title: `${t("title")} | PowerPlay`,
    description: t("subtitle"),
  };
}

export default async function YouthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Return unauthenticated landing view
    return (
      <YouthClient
        locale={locale}
        user={null}
        userProfile={null}
        myApplication={null}
        initialPosts={[]}
        newsList={[]}
        isSuperUser={false}
      />
    );
  }

  // Fetch profile, application, and items in parallel to optimize load speed
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, parent_verification_status, full_name, parent_nickname")
    .eq("id", user.id)
    .single();

  const myApplication = await getMyParentApplication();

  const isApproved = profile?.parent_verification_status === "approved";
  const isSuperUser = profile?.role === "superuser";

  let posts: ParentPost[] = [];
  let newsList: ParentNews[] = [];

  if (isApproved || isSuperUser) {
    const [fetchedPosts, fetchedNews] = await Promise.all([
      getParentPosts(1, 40),
      getParentNewsList(),
    ]);
    posts = fetchedPosts;
    newsList = fetchedNews;
  }

  return (
    <YouthClient
      locale={locale}
      user={user}
      userProfile={profile}
      myApplication={myApplication}
      initialPosts={posts}
      newsList={newsList}
      isSuperUser={isSuperUser}
    />
  );
}
