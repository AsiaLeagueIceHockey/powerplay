"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { compressImageToWebp } from "@/lib/image-utils";
import { sendPushNotification } from "@/app/actions/push";

// ==========================================================
// Types
// ==========================================================

export interface ParentApplication {
  id: string;
  user_id: string;
  child_name: string;
  child_birth_year: number;
  child_club: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface ParentPost {
  id: string;
  user_id: string;
  nickname: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface ParentComment {
  id: string;
  post_id: string;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ParentNews {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================================
// Helper Functions (Auth & Permission Checks)
// ==========================================================

/**
 * Checks if the current user is an Admin or Superuser
 */
export async function checkIsAdminOrSuperUser(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return ["admin", "superuser"].includes(profile?.role ?? "");
}

/**
 * Checks if the current user has approved parent status OR is admin/superuser
 */
export async function checkIsApprovedParentOrAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, parent_verification_status")
    .eq("id", user.id)
    .single();

  if (!profile) return false;
  
  const isApprovedParent = profile.parent_verification_status === "approved";
  const isAdmin = ["admin", "superuser"].includes(profile.role ?? "");

  return isApprovedParent || isAdmin;
}

// ==========================================================
// 1. Parent Membership Applications Actions
// ==========================================================

/**
 * Submit parent membership application
 */
export async function applyForParentMembership(
  childName: string,
  childBirthYear: number,
  childClub: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Update profiles status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ parent_verification_status: "pending" })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile status:", profileError);
      return { success: false, error: profileError.message };
    }

    // 2. Upsert application
    const { error: appError } = await supabase
      .from("parent_applications")
      .upsert({
        user_id: user.id,
        child_name: childName,
        child_birth_year: childBirthYear,
        child_club: childClub,
        description: description || null,
        status: "pending",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (appError) {
      console.error("Error upserting application:", appError);
      return { success: false, error: appError.message };
    }

    // Revalidate paths
    revalidatePath("/youth");
    revalidatePath("/[locale]/youth", "page");

    return { success: true };
  } catch (err: any) {
    console.error("applyForParentMembership unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

/**
 * Get current user's parent application
 */
export async function getMyParentApplication(): Promise<ParentApplication | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("parent_applications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error getting parent application:", error);
      return null;
    }

    return data as ParentApplication | null;
  } catch (err) {
    console.error("getMyParentApplication unexpected error:", err);
    return null;
  }
}

/**
 * Get all pending parent applications (Admin/SuperUser only)
 */
export async function getPendingParentApplications(): Promise<ParentApplication[]> {
  try {
    const supabase = await createClient();
    const isAdmin = await checkIsAdminOrSuperUser();
    if (!isAdmin) return [];

    const { data, error } = await supabase
      .from("parent_applications")
      .select(`
        *,
        user:user_id(id, email, full_name, phone)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting pending applications:", error);
      return [];
    }

    return (data || []).map((item) => ({
      ...item,
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    })) as ParentApplication[];
  } catch (err) {
    console.error("getPendingParentApplications unexpected error:", err);
    return [];
  }
}

/**
 * Approve or Reject parent membership application (Admin/SuperUser only)
 */
export async function reviewParentApplication(
  applicationId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const isAdmin = await checkIsAdminOrSuperUser();
    if (!isAdmin) return { success: false, error: "Unauthorized" };

    // 1. Fetch application to find user_id
    const { data: app, error: fetchError } = await supabase
      .from("parent_applications")
      .select("user_id, child_name")
      .eq("id", applicationId)
      .single();

    if (fetchError || !app) {
      return { success: false, error: "Application not found" };
    }

    // 2. Update application status
    const { error: appError } = await supabase
      .from("parent_applications")
      .update({
        status,
        rejection_reason: status === "rejected" ? (rejectionReason || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (appError) {
      console.error("Error updating application:", appError);
      return { success: false, error: appError.message };
    }

    // 3. Update profile status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ parent_verification_status: status })
      .eq("id", app.user_id);

    if (profileError) {
      console.error("Error updating profile status:", profileError);
      return { success: false, error: profileError.message };
    }

    // 4. Send notification to user
    const title = status === "approved" ? "파워유스 학부모 승인 완료 🎉" : "파워유스 학부모 인증 반려 ❌";
    const body = status === "approved"
      ? `축하합니다! ${app.child_name} 학부모님, 인증이 승인되어 파워유스 커뮤니티 입장이 가능합니다.`
      : `인증 신청이 반려되었습니다. 반려 사유: ${rejectionReason || "제출 정보 확인 필요"}`;

    await sendPushNotification(app.user_id, title, body, "/youth");

    // Revalidate paths
    revalidatePath("/youth");
    revalidatePath("/admin/parent-applications");

    return { success: true };
  } catch (err: any) {
    console.error("reviewParentApplication unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

// ==========================================================
// 2. Parent Community Posts Actions
// ==========================================================

/**
 * Get parent community posts list (Requires approved parent/admin)
 */
export async function getParentPosts(page: number = 1, limit: number = 20): Promise<ParentPost[]> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return [];

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch posts along with comment counts
    // We can fetch posts first, then count comments or use a left join/rpc.
    // In Supabase client, we can do: select('*, parent_comments(count)')
    const { data, error } = await supabase
      .from("parent_posts")
      .select(`
        *,
        parent_comments(count)
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching parent posts:", error);
      return [];
    }

    return (data || []).map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      nickname: post.nickname,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      comment_count: post.parent_comments?.[0]?.count ?? 0,
    })) as ParentPost[];
  } catch (err) {
    console.error("getParentPosts unexpected error:", err);
    return [];
  }
}

/**
 * Get a parent community post detail with its comments (Requires approved parent/admin)
 */
export async function getParentPostDetail(
  postId: string
): Promise<{ post: ParentPost | null; comments: ParentComment[] }> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return { post: null, comments: [] };

    const { data: post, error: postError } = await supabase
      .from("parent_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) {
      console.error("Error fetching post detail:", postError);
      return { post: null, comments: [] };
    }

    const { data: comments, error: commentError } = await supabase
      .from("parent_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentError) {
      console.error("Error fetching comments:", commentError);
    }

    return {
      post: post as ParentPost,
      comments: (comments || []) as ParentComment[],
    };
  } catch (err) {
    console.error("getParentPostDetail unexpected error:", err);
    return { post: null, comments: [] };
  }
}

/**
 * Create a new parent community post (Requires approved parent/admin)
 */
export async function createParentPost(
  title: string,
  content: string,
  nickname: string,
  imageUrl?: string
): Promise<{ success: boolean; post?: ParentPost; error?: string }> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return { success: false, error: "Unauthorized" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("parent_posts")
      .insert({
        user_id: user.id,
        nickname,
        title,
        content,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting post:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/youth");

    return { success: true, post: data as ParentPost };
  } catch (err: any) {
    console.error("createParentPost unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

/**
 * Delete parent post (Owner or Admin only)
 */
export async function deleteParentPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const isAdmin = await checkIsAdminOrSuperUser();

    // 1. Fetch post to verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("parent_posts")
      .select("user_id, image_url")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return { success: false, error: "Post not found" };
    }

    if (post.user_id !== user.id && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this post" };
    }

    // 2. Delete the post
    const { error: deleteError } = await supabase
      .from("parent_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // 3. Delete image from Storage if it exists
    if (post.image_url) {
      try {
        const urlParts = post.image_url.split("/parent-posts/");
        if (urlParts.length > 1) {
          const fileName = urlParts[1];
          await supabase.storage.from("parent-posts").remove([fileName]);
        }
      } catch (storageError) {
        console.error("Error deleting post image from storage:", storageError);
      }
    }

    revalidatePath("/youth");

    return { success: true };
  } catch (err: any) {
    console.error("deleteParentPost unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

// ==========================================================
// 3. Parent Comments Actions
// ==========================================================

/**
 * Create a new parent comment (Requires approved parent/admin)
 */
export async function createParentComment(
  postId: string,
  content: string,
  nickname: string
): Promise<{ success: boolean; comment?: ParentComment; error?: string }> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return { success: false, error: "Unauthorized" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("parent_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        nickname,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting comment:", error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/youth/community/${postId}`);

    // Optional: notify post owner if someone else comments
    const { data: post } = await supabase
      .from("parent_posts")
      .select("user_id, title")
      .eq("id", postId)
      .single();

    if (post && post.user_id !== user.id) {
      await sendPushNotification(
        post.user_id,
        "새 댓글 알림 💬",
        `학부모 커뮤니티 게시글에 새 댓글이 달렸습니다: "${content.substring(0, 30)}"`,
        `/youth/community/${postId}`
      );
    }

    return { success: true, comment: data as ParentComment };
  } catch (err: any) {
    console.error("createParentComment unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

/**
 * Delete a comment (Owner or Admin only)
 */
export async function deleteParentComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const isAdmin = await checkIsAdminOrSuperUser();

    // 1. Fetch comment to verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from("parent_comments")
      .select("user_id, post_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return { success: false, error: "Comment not found" };
    }

    if (comment.user_id !== user.id && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this comment" };
    }

    // 2. Delete the comment
    const { error: deleteError } = await supabase
      .from("parent_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath(`/youth/community/${comment.post_id}`);

    return { success: true };
  } catch (err: any) {
    console.error("deleteParentComment unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

// ==========================================================
// 4. Parent News Actions
// ==========================================================

/**
 * Get all parent news list (Requires approved parent/admin)
 */
export async function getParentNewsList(): Promise<ParentNews[]> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return [];

    const { data, error } = await supabase
      .from("parent_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }

    return data as ParentNews[];
  } catch (err) {
    console.error("getParentNewsList unexpected error:", err);
    return [];
  }
}

/**
 * Create parent news (Admin/SuperUser only)
 */
export async function createParentNews(
  title: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; news?: ParentNews; error?: string }> {
  try {
    const supabase = await createClient();
    const isAdmin = await checkIsAdminOrSuperUser();
    if (!isAdmin) return { success: false, error: "Unauthorized" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("parent_news")
      .insert({
        title,
        content,
        image_url: imageUrl || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating news:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/youth");

    return { success: true, news: data as ParentNews };
  } catch (err: any) {
    console.error("createParentNews unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

/**
 * Delete parent news (Admin/SuperUser only)
 */
export async function deleteParentNews(newsId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const isAdmin = await checkIsAdminOrSuperUser();
    if (!isAdmin) return { success: false, error: "Unauthorized" };

    // Find and delete the news
    const { data: news, error: fetchError } = await supabase
      .from("parent_news")
      .select("image_url")
      .eq("id", newsId)
      .single();

    if (fetchError || !news) {
      return { success: false, error: "News not found" };
    }

    const { error: deleteError } = await supabase
      .from("parent_news")
      .delete()
      .eq("id", newsId);

    if (deleteError) {
      console.error("Error deleting news:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Delete image if exists
    if (news.image_url) {
      try {
        const urlParts = news.image_url.split("/parent-posts/");
        if (urlParts.length > 1) {
          const fileName = urlParts[1];
          await supabase.storage.from("parent-posts").remove([fileName]);
        }
      } catch (storageError) {
        console.error("Error deleting news image from storage:", storageError);
      }
    }

    revalidatePath("/youth");

    return { success: true };
  } catch (err: any) {
    console.error("deleteParentNews unexpected error:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

// ==========================================================
// 5. Parent Post Image Upload Action
// ==========================================================

/**
 * Compress and upload parent community/news image to 'parent-posts' storage bucket
 */
export async function uploadParentPostImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return { error: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { error: "No file provided" };
    }

    // Sharp compression (cover mode, suitable for general post photos)
    let compressed: Buffer;
    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      compressed = await compressImageToWebp(inputBuffer, "cover");
    } catch (compressError) {
      console.error("Image compression error:", compressError);
      return { error: "Failed to process image" };
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("parent-posts")
      .upload(fileName, compressed, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("parent-posts")
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (err: any) {
    console.error("uploadParentPostImage unexpected error:", err);
    return { error: err.message || "Failed to upload image" };
  }
}

/**
 * Update the user's parent nickname in profiles (Requires approved parent/admin)
 */
export async function updateParentNickname(
  nickname: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const isAllowed = await checkIsApprovedParentOrAdmin();
    if (!isAllowed) return { success: false, error: "Unauthorized" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const trimmed = nickname.trim();
    if (!trimmed) return { success: false, error: "Nickname cannot be empty" };

    const { error } = await supabase
      .from("profiles")
      .update({ parent_nickname: trimmed })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating parent nickname:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/youth");
    revalidatePath("/[locale]/youth", "page");
    return { success: true };
  } catch (err: any) {
    console.error("updateParentNickname unexpected error:", err);
    return { success: false, error: err.message || "Unexpected error occurred" };
  }
}
