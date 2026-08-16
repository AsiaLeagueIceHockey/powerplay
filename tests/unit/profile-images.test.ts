import { describe, expect, it, vi } from "vitest";

import {
  buildProfileImagePath,
  extractProfileImagePath,
  PROFILE_IMAGE_MAX_BYTES,
} from "@/lib/profile-images";
import { PROFILE_IMAGE_SOURCE_MAX_BYTES } from "@/lib/profile-image-client";

describe("profile image helpers", () => {
  it("builds a WebP object path inside the authenticated user's folder", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111"
    );

    expect(buildProfileImagePath("user-123")).toBe(
      "user-123/11111111-1111-4111-8111-111111111111.webp"
    );
  });

  it("extracts only profile-image paths belonging to the expected user", () => {
    const ownUrl =
      "https://project.supabase.co/storage/v1/object/public/profile-images/user-123/avatar.webp";

    expect(extractProfileImagePath(ownUrl, "user-123")).toBe(
      "user-123/avatar.webp"
    );
    expect(extractProfileImagePath(ownUrl, "another-user")).toBeNull();
    expect(
      extractProfileImagePath(
        "https://project.supabase.co/storage/v1/object/public/club-logos/user-123/avatar.webp",
        "user-123"
      )
    ).toBeNull();
  });

  it("accepts large source photos but keeps the server upload compressed", () => {
    expect(PROFILE_IMAGE_SOURCE_MAX_BYTES).toBe(20 * 1024 * 1024);
    expect(PROFILE_IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
