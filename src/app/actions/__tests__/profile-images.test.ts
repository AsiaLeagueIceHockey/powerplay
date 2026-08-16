import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockLogAndNotify, mockRevalidatePath } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockLogAndNotify: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/audit", () => ({ logAndNotify: mockLogAndNotify }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { updateProfile } from "../auth";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OLD_AVATAR = `https://project.supabase.co/storage/v1/object/public/profile-images/${USER_ID}/old.webp`;

function setupClient() {
  const currentProfileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn().mockResolvedValue({
      data: { primary_club_id: null, avatar_url: OLD_AVATAR },
      error: null,
    }),
  };
  currentProfileQuery.select.mockReturnValue(currentProfileQuery);
  currentProfileQuery.eq.mockReturnValue(currentProfileQuery);

  const profileUpdateQuery = {
    update: vi.fn(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  profileUpdateQuery.update.mockReturnValue(profileUpdateQuery);

  let profileCall = 0;
  const storageBucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn((path: string) => ({
      data: {
        publicUrl: `https://project.supabase.co/storage/v1/object/public/profile-images/${path}`,
      },
    })),
  };
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID, email: "player@example.com" } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table !== "profiles") throw new Error(`Unexpected table: ${table}`);
      profileCall += 1;
      return profileCall === 1 ? currentProfileQuery : profileUpdateQuery;
    }),
    storage: { from: vi.fn(() => storageBucket) },
  };
  mockCreateClient.mockResolvedValue(client);

  return { profileUpdateQuery, storageBucket };
}

describe("profile image updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogAndNotify.mockResolvedValue(undefined);
  });

  it("compresses a new avatar, saves its URL, and removes the previous image", async () => {
    const { profileUpdateQuery, storageBucket } = setupClient();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="blue"/></svg>';
    const formData = new FormData();
    formData.set("avatarUrl", OLD_AVATAR);
    formData.set("avatarFile", new File([svg], "avatar.svg", { type: "image/svg+xml" }));

    const result = await updateProfile(formData);

    expect(result).toMatchObject({ success: true });
    expect(profileUpdateQuery.update).toHaveBeenCalledWith({
      avatar_url: expect.stringMatching(
        new RegExp(`/profile-images/${USER_ID}/.+\\.webp$`)
      ),
    });
    expect(storageBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^${USER_ID}/.+\\.webp$`)),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/webp", upsert: false })
    );
    expect(storageBucket.remove).toHaveBeenCalledWith([`${USER_ID}/old.webp`]);
  });

  it("stores null and removes the previous object when the photo is removed", async () => {
    const { profileUpdateQuery, storageBucket } = setupClient();
    const formData = new FormData();
    formData.set("avatarUrl", "");

    const result = await updateProfile(formData);

    expect(result).toMatchObject({ success: true, avatarUrl: null });
    expect(profileUpdateQuery.update).toHaveBeenCalledWith({ avatar_url: null });
    expect(storageBucket.upload).not.toHaveBeenCalled();
    expect(storageBucket.remove).toHaveBeenCalledWith([`${USER_ID}/old.webp`]);
  });
});
