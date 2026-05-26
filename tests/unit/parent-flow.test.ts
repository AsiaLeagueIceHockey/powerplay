import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  applyForParentMembership, 
  reviewParentApplication,
  getParentPostDetail,
  toggleParentPostLike,
  uploadVerificationPhoto
} from "@/app/actions/parent";

// Mock Supabase Server Client
const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockRpc = vi.fn();
const mockMaybeSingle = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();
const mockEq = vi.fn();

let mockCountValue: number | null = null;
let mockDataValue: any = null;
let mockErrorValue: any = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
    from: vi.fn().mockImplementation(() => {
      const chain: any = {
        select: mockSelect.mockReturnThis(),
        update: mockUpdate.mockReturnThis(),
        upsert: mockUpsert.mockReturnThis(),
        delete: mockDelete.mockReturnThis(),
        insert: mockInsert.mockReturnThis(),
        order: mockOrder.mockReturnThis(),
        in: mockIn.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        then: vi.fn().mockImplementation((onfulfilled) => {
          if (onfulfilled) {
            onfulfilled({ count: mockCountValue, data: mockDataValue, error: mockErrorValue });
          }
        })
      };
      return chain;
    }),
  })),
}));

// Mock Next.js cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Push Notification Action
vi.mock("@/app/actions/push", () => ({
  sendPushNotification: vi.fn().mockResolvedValue(true),
}));

// Mock Audit Log Action
vi.mock("@/lib/audit", () => ({
  logAndNotify: vi.fn().mockResolvedValue(undefined),
}));

describe("Parent Membership Flow Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountValue = null;
    mockDataValue = null;
    mockErrorValue = null;
  });

  describe("applyForParentMembership", () => {
    it("should return Unauthorized when user is not logged in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await applyForParentMembership("홍유스", 2016, "목동 주니어");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should successfully update profile and upsert application for authenticated user", async () => {
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: { id: "user-123", email: "parent@example.com" } } 
      });
      mockUpdate.mockReturnValue({ error: null });
      mockUpsert.mockReturnValue({ error: null });

      const result = await applyForParentMembership("홍유스", 2016, "목동 주니어", "mother", "http://image.url/photo.jpg", "열심히 하겠습니다.");
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ parent_verification_status: "pending" });
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe("reviewParentApplication", () => {
    it("should fail if reviewer is not a Superuser", async () => {
      // Simulate normal user trying to review
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-456" } } });
      // role profile single returns 'user'
      mockSingle.mockResolvedValueOnce({ data: { role: "user" } });

      const result = await reviewParentApplication("app-789", "approved");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should successfully approve application and update profile role status for superuser", async () => {
      // 1. Authenticate as superuser
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-123" } } });
      mockSingle.mockResolvedValueOnce({ data: { role: "superuser" } }); // profiles checkIsSuperUser
      
      // 2. Fetch application
      mockSingle.mockResolvedValueOnce({ 
        data: { user_id: "user-abc", child_name: "이유스" } 
      });

      // 3. Mock updates
      mockUpdate.mockReturnValue({ error: null }); // parent_applications
      mockUpdate.mockReturnValue({ error: null }); // profiles update

      const result = await reviewParentApplication("app-789", "approved");
      expect(result.success).toBe(true);
    });
  });

  describe("getParentPostDetail", () => {
    it("should fail if unauthorized", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await getParentPostDetail("post-123");
      expect(result.post).toBeNull();
    });

    it("should successfully fetch post details, increment views, and resolve nicknames", async () => {
      // 1. mock auth checks
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      mockSingle.mockResolvedValueOnce({ 
        data: { role: "user", parent_verification_status: "approved" } 
      }); // checkIsApprovedParentOrSuperUser profile check

      // 2. mock post detail fetch (select from parent_posts)
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: "post-123",
          user_id: "creator-id",
          nickname: "OldCreatorName",
          title: "Test Post",
          content: "Body of test post",
          views_count: 5,
          parent_post_likes: [{ count: 2 }],
          parent_comments: [{ count: 1 }],
          profiles: { parent_nickname: "NewCreatorName", full_name: "John Doe" }
        }
      });

      // 3. mock checking like (select from parent_post_likes)
      mockMaybeSingle.mockResolvedValueOnce({
        data: { post_id: "post-123", user_id: "user-123" }
      });

      // 4. mock comments fetch
      mockSelect.mockReturnThis();
      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: "comment-1",
            post_id: "post-123",
            user_id: "commenter-id",
            nickname: "OldCommenterName",
            content: "Comment content",
            created_at: "2026-05-25T00:00:00Z",
            profiles: { parent_nickname: "NewCommenterName", full_name: "Jane Smith" }
          }
        ]
      });

      const { post, comments } = await getParentPostDetail("post-123");

      // Verify RPC view increment was called
      expect(mockRpc).toHaveBeenCalledWith("increment_parent_post_views", { target_post_id: "post-123" });
      
      // Verify post fields and dynamically resolved creator nickname
      expect(post).not.toBeNull();
      expect(post?.nickname).toBe("NewCreatorName");
      expect(post?.is_liked).toBe(true);
      expect(post?.likes_count).toBe(2);

      // Verify comments and dynamically resolved commenter nickname
      expect(comments.length).toBe(1);
      expect(comments[0].nickname).toBe("NewCommenterName");
    });
  });

  describe("toggleParentPostLike", () => {
    it("should successfully toggle like (insert when not liked)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      // checkIsApprovedParentOrSuperUser
      mockSingle.mockResolvedValueOnce({ 
        data: { role: "user", parent_verification_status: "approved" } 
      });

      // 1. Check existing like (returns null => not liked)
      mockMaybeSingle.mockResolvedValueOnce({ data: null });

      // 2. Mock insert
      mockInsert.mockReturnValue({ error: null });

      // 3. Mock post creator query
      mockSingle.mockResolvedValueOnce({ 
        data: { user_id: "creator-id" } 
      });

      // 4. Mock liker profile query
      mockSingle.mockResolvedValueOnce({ 
        data: { parent_nickname: "LikerNick", full_name: "Liker Full" } 
      });

      // 5. Mock updated count (returns count = 1 via thenable)
      mockCountValue = 1;

      const result = await toggleParentPostLike("post-123");
      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({ post_id: "post-123", user_id: "user-123" });
    });

    it("should successfully toggle unlike (delete when already liked)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
      // checkIsApprovedParentOrSuperUser
      mockSingle.mockResolvedValueOnce({ 
        data: { role: "user", parent_verification_status: "approved" } 
      });

      // 1. Check existing like (returns existing => liked)
      mockMaybeSingle.mockResolvedValueOnce({ data: { post_id: "post-123", user_id: "user-123" } });

      // 2. Mock delete
      mockDelete.mockReturnValue({ error: null });

      // 3. Mock updated count (returns count = 0 via thenable)
      mockCountValue = 0;

      const result = await toggleParentPostLike("post-123");
      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(false);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("uploadVerificationPhoto", () => {
    it("should fail upload if not logged in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const formData = new FormData();
      formData.append("file", { size: 100 } as any);

      const result = await uploadVerificationPhoto(formData);
      expect(result.error).toBe("Unauthorized");
    });
  });
});

