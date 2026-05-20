import { describe, expect, it, vi, beforeEach } from "vitest";
import { 
  applyForParentMembership, 
  reviewParentApplication 
} from "@/app/actions/parent";

// Mock Supabase Server Client
const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn().mockImplementation(() => {
      const chain = {
        select: mockSelect.mockReturnThis(),
        update: mockUpdate.mockReturnThis(),
        upsert: mockUpsert.mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle,
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

describe("Parent Membership Flow Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      const result = await applyForParentMembership("홍유스", 2016, "목동 주니어", "열심히 하겠습니다.");
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ parent_verification_status: "pending" });
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe("reviewParentApplication", () => {
    it("should fail if reviewer is not an Admin or Superuser", async () => {
      // Simulate normal user trying to review
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-456" } } });
      // role profile single returns 'user'
      mockSingle.mockResolvedValueOnce({ data: { role: "user" } });

      const result = await reviewParentApplication("app-789", "approved");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should successfully approve application and update profile role status for admin user", async () => {
      // 1. Authenticate as admin
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "admin-123" } } });
      mockSingle.mockResolvedValueOnce({ data: { role: "admin" } }); // profiles checkIsAdminOrSuperUser
      
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
});
