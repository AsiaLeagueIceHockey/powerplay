const PROFILE_IMAGE_MARKER = "/storage/v1/object/public/profile-images/";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function buildProfileImagePath(userId: string): string {
  return `${userId}/${crypto.randomUUID()}.webp`;
}

export function extractProfileImagePath(
  imageUrl: string | null | undefined,
  expectedUserId?: string
): string | null {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    if (!url.pathname.startsWith(PROFILE_IMAGE_MARKER)) return null;

    const path = decodeURIComponent(url.pathname.slice(PROFILE_IMAGE_MARKER.length));
    if (!path || path.split("/").includes("..")) return null;
    if (expectedUserId && !path.startsWith(`${expectedUserId}/`)) return null;
    return path;
  } catch {
    return null;
  }
}
