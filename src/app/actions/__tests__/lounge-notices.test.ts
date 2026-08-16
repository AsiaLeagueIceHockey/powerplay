import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateClient,
  mockRevalidatePath,
  mockSendPushNotification,
  mockSendPushToSuperUsers,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockSendPushNotification: vi.fn(),
  mockSendPushToSuperUsers: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/app/actions/push", () => ({
  sendPushNotification: mockSendPushNotification,
  sendPushToSuperUsers: mockSendPushToSuperUsers,
}));

import {
  createLoungeNotice,
  deleteLoungeNotice,
  getManagedLoungeNotices,
  getPublicLoungeNoticeDetail,
  getPublicLoungeNotices,
  subscribeToLoungeNotices,
  unsubscribeFromLoungeNotices,
  updateLoungeNotice,
  uploadLoungeNoticeImage,
} from "../lounge-notices";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const BUSINESS_ID = "22222222-2222-4222-8222-222222222222";
const NOTICE_ID = "33333333-3333-4333-8333-333333333333";
const REQUEST_ID = "44444444-4444-4444-8444-444444444444";

function chain() {
  const value: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "lte",
    "gte",
    "limit",
    "order",
  ]) {
    value[method] = vi.fn(() => value);
  }
  value.single = vi.fn();
  value.maybeSingle = vi.fn();
  return value;
}

function notice(overrides: Record<string, unknown> = {}) {
  return {
    id: NOTICE_ID,
    business_id: BUSINESS_ID,
    title: "New notice",
    body: "Notice body",
    image_url: null,
    created_by: USER_ID,
    request_id: REQUEST_ID,
    created_at: "2026-08-09T00:00:00.000Z",
    updated_at: "2026-08-09T00:00:00.000Z",
    ...overrides,
  };
}

function business(overrides: Record<string, unknown> = {}) {
  return {
    id: BUSINESS_ID,
    owner_user_id: USER_ID,
    slug: "test-business",
    name: "Test Business",
    is_published: true,
    ...overrides,
  };
}

function createForm(requestId = REQUEST_ID) {
  const formData = new FormData();
  formData.set("business_id", BUSINESS_ID);
  formData.set("title", "  New notice  ");
  formData.set("body", "  Notice body  ");
  formData.set("request_id", requestId);
  return formData;
}

function updateForm() {
  const formData = new FormData();
  formData.set("notice_id", NOTICE_ID);
  formData.set("title", "Updated");
  formData.set("body", "Updated body");
  return formData;
}

function setupClient(options?: {
  user?: { id: string } | null;
  role?: "admin" | "superuser" | "user";
  ownerId?: string;
  membership?: boolean;
}) {
  const profiles = chain();
  const businesses = chain();
  const memberships = chain();
  const notices = chain();
  const subscriptions = chain();
  const storageBucket = {
    remove: vi.fn().mockResolvedValue({ error: null }),
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/club-logos/${path}` },
    })),
  };
  const user = options?.user === undefined ? { id: USER_ID } : options.user;

  profiles.maybeSingle.mockResolvedValue({ data: { role: options?.role ?? "admin" }, error: null });
  businesses.maybeSingle.mockResolvedValue({
    data: business({ owner_user_id: options?.ownerId ?? USER_ID }),
    error: null,
  });
  memberships.maybeSingle.mockResolvedValue({
    data: options?.membership === false ? null : { id: "membership" },
    error: null,
  });

  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn((table: string) => {
      if (table === "profiles") return profiles;
      if (table === "lounge_businesses") return businesses;
      if (table === "lounge_memberships") return memberships;
      if (table === "lounge_notices") return notices;
      if (table === "lounge_notice_subscriptions") return subscriptions;
      throw new Error(`Unexpected table: ${table}`);
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    storage: { from: vi.fn(() => storageBucket) },
  };
  mockCreateClient.mockResolvedValue(client);

  return { client, profiles, businesses, memberships, notices, subscriptions, storageBucket };
}

describe("Lounge notice actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendPushNotification.mockResolvedValue({ success: true, sent: 1 });
    mockSendPushToSuperUsers.mockResolvedValue({ success: true, sent: 1 });
  });

  it.each([
    ["anonymous", { user: null }, false],
    ["unrelated admin", { ownerId: "someone-else" }, false],
    ["expired owner", { membership: false }, false],
    ["active owner", {}, true],
    ["superuser", { role: "superuser", ownerId: "someone-else", membership: false }, true],
  ] as const)("enforces the %s managed-read authorization", async (_name, options, allowed) => {
    const { notices } = setupClient(options);
    notices.order
      .mockReturnValueOnce(notices)
      .mockResolvedValueOnce({ data: [notice()], error: null });

    const result = await getManagedLoungeNotices(BUSINESS_ID);

    expect(result).toHaveLength(allowed ? 1 : 0);
  });

  it("surfaces a managed-list database failure instead of presenting an empty state", async () => {
    const { notices } = setupClient();
    notices.order
      .mockReturnValueOnce(notices)
      .mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });

    await expect(getManagedLoungeNotices(BUSINESS_ID)).rejects.toThrow(
      "Failed to load managed Lounge notices"
    );
  });

  it("creates once, fans out to unique recipients, deep-links, and skips email", async () => {
    const { client, notices } = setupClient();
    notices.single.mockResolvedValue({ data: notice(), error: null });
    client.rpc.mockResolvedValue({
      data: [{ user_id: "subscriber-1" }, { user_id: "subscriber-1" }, { user_id: USER_ID }],
      error: null,
    });

    const result = await createLoungeNotice(createForm());

    expect(result).toMatchObject({ success: true, created: true });
    expect(notices.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New notice", body: "Notice body", request_id: REQUEST_ID })
    );
    expect(mockSendPushNotification).toHaveBeenCalledTimes(1);
    expect(mockSendPushNotification).toHaveBeenCalledWith(
      "subscriber-1",
      "Test Business 새 공지",
      "New notice",
      `/ko/lounge/test-business/notices/${NOTICE_ID}`,
      { skipEmail: true }
    );
    expect(mockSendPushToSuperUsers).toHaveBeenCalledWith(
      "Test Business 새 라운지 공지",
      "New notice",
      "/ko/admin/lounge-management"
    );
  });

  it.each([
    ["anonymous", { user: null }],
    ["unrelated admin", { ownerId: "someone-else" }],
    ["expired owner", { membership: false }],
    ["non-admin owner", { role: "user" }],
  ] as const)("rejects create for an %s", async (_name, options) => {
    const { notices } = setupClient(options);

    await expect(createLoungeNotice(createForm())).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(notices.insert).not.toHaveBeenCalled();
  });

  it("allows a superuser to create for another business without owner membership", async () => {
    const { client, notices } = setupClient({
      role: "superuser",
      ownerId: "someone-else",
      membership: false,
    });
    notices.single.mockResolvedValue({ data: notice(), error: null });
    client.rpc.mockResolvedValue({ data: [], error: null });

    await expect(createLoungeNotice(createForm())).resolves.toMatchObject({
      success: true,
      created: true,
    });
    expect(notices.insert).toHaveBeenCalledTimes(1);
  });

  it("treats a request-id conflict as the existing successful notice without another push", async () => {
    const { notices } = setupClient();
    notices.single.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } });
    notices.maybeSingle.mockResolvedValueOnce({ data: notice(), error: null });

    const result = await createLoungeNotice(createForm());

    expect(result).toMatchObject({ success: true, created: false, notice: { id: NOTICE_ID } });
    expect(mockSendPushNotification).not.toHaveBeenCalled();
    expect(mockSendPushToSuperUsers).not.toHaveBeenCalled();
  });

  it("keeps a new notice successful when the SuperUser push helper throws", async () => {
    const { client, notices } = setupClient();
    notices.single.mockResolvedValue({ data: notice(), error: null });
    client.rpc.mockResolvedValue({ data: [], error: null });
    mockSendPushToSuperUsers.mockRejectedValue(new Error("push unavailable"));

    await expect(createLoungeNotice(createForm())).resolves.toMatchObject({
      success: true,
      created: true,
      notice: { id: NOTICE_ID },
    });
  });

  it("keeps persistence successful when recipient lookup fails", async () => {
    const { client, notices } = setupClient();
    notices.single.mockResolvedValue({ data: notice(), error: null });
    client.rpc.mockResolvedValue({ data: null, error: { message: "rpc failed" } });

    const result = await createLoungeNotice(createForm());

    expect(result).toMatchObject({ success: true, created: true, notice: { id: NOTICE_ID } });
    expect(mockSendPushNotification).not.toHaveBeenCalled();
  });

  it("keeps persistence successful and reports a handled push failure", async () => {
    const { client, notices } = setupClient();
    notices.single.mockResolvedValue({ data: notice(), error: null });
    client.rpc.mockResolvedValue({ data: [{ user_id: "subscriber-1" }], error: null });
    mockSendPushNotification.mockResolvedValue({
      success: false,
      error: "VAPID not configured",
    });

    const result = await createLoungeNotice(createForm());

    expect(result).toMatchObject({
      success: true,
      created: true,
      notice: { id: NOTICE_ID },
      delivery: { intendedUsers: 1, successfulUsers: 0, handledFailures: 1 },
    });
    expect(mockSendPushNotification).toHaveBeenCalledTimes(1);
  });

  it("updates in place and never pushes", async () => {
    const { notices } = setupClient();
    notices.maybeSingle.mockResolvedValue({ data: notice(), error: null });
    notices.single.mockResolvedValue({
      data: notice({ title: "Updated", body: "Updated body" }),
      error: null,
    });

    const result = await updateLoungeNotice(updateForm());

    expect(result).toMatchObject({ success: true, notice: { id: NOTICE_ID, title: "Updated" } });
    expect(notices.update).toHaveBeenCalledWith({
      title: "Updated",
      body: "Updated body",
      image_url: null,
    });
    expect(mockSendPushNotification).not.toHaveBeenCalled();
    expect(mockSendPushToSuperUsers).not.toHaveBeenCalled();
  });

  it("replaces a notice image and removes the prior stored object after the update", async () => {
    const oldImage = `https://example.supabase.co/storage/v1/object/public/club-logos/lounge/notices/${BUSINESS_ID}/old.webp`;
    const newImage = `https://example.supabase.co/storage/v1/object/public/club-logos/lounge/notices/${BUSINESS_ID}/new.webp`;
    const { notices, storageBucket } = setupClient();
    notices.maybeSingle.mockResolvedValue({ data: notice({ image_url: oldImage }), error: null });
    notices.single.mockResolvedValue({
      data: notice({ title: "Updated", body: "Updated body", image_url: newImage }),
      error: null,
    });
    const formData = updateForm();
    formData.set("image_url", newImage);

    const result = await updateLoungeNotice(formData);

    expect(result).toMatchObject({ success: true, notice: { image_url: newImage } });
    expect(notices.update).toHaveBeenCalledWith(
      expect.objectContaining({ image_url: newImage })
    );
    expect(storageBucket.remove).toHaveBeenCalledWith([
      `lounge/notices/${BUSINESS_ID}/old.webp`,
    ]);
  });

  it("rejects an image URL outside the authorized Lounge notice storage path", async () => {
    const { notices } = setupClient();
    const formData = createForm();
    formData.set(
      "image_url",
      "https://example.supabase.co/storage/v1/object/public/club-logos/lounge/notices/another-business/image.webp"
    );

    await expect(createLoungeNotice(formData)).resolves.toEqual({
      success: false,
      error: "Invalid Lounge notice image URL",
    });
    expect(notices.insert).not.toHaveBeenCalled();
  });

  it("compresses an authorized image upload into the business-scoped notice path", async () => {
    const { storageBucket } = setupClient();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>';
    const formData = new FormData();
    formData.set("business_id", BUSINESS_ID);
    formData.set("file", new File([svg], "notice.svg", { type: "image/svg+xml" }));

    const result = await uploadLoungeNoticeImage(formData);

    expect(result.url).toMatch(
      new RegExp(`/club-logos/lounge/notices/${BUSINESS_ID}/.+\\.webp$`)
    );
    expect(storageBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^lounge/notices/${BUSINESS_ID}/.+\\.webp$`)),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/webp", upsert: false })
    );
  });

  it("rejects update and delete when the caller does not own the notice business", async () => {
    const { notices } = setupClient({ ownerId: "someone-else" });
    notices.maybeSingle.mockResolvedValue({ data: notice(), error: null });

    await expect(updateLoungeNotice(updateForm())).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
    await expect(deleteLoungeNotice(NOTICE_ID)).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(notices.update).not.toHaveBeenCalled();
    expect(notices.delete).not.toHaveBeenCalled();
  });

  it("deletes without push and invalidates the stable detail path", async () => {
    const { notices } = setupClient();
    notices.maybeSingle.mockResolvedValue({ data: notice(), error: null });

    const result = await deleteLoungeNotice(NOTICE_ID);

    expect(result).toEqual({ success: true });
    expect(mockSendPushNotification).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/ko/lounge/test-business/notices/${NOTICE_ID}`
    );
  });

  it("returns null when the requested public notice does not exist", async () => {
    const { notices } = setupClient();
    notices.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getPublicLoungeNoticeDetail("test-business", NOTICE_ID)).resolves.toBeNull();
    expect(notices.eq).toHaveBeenCalledWith("business_id", BUSINESS_ID);
  });

  it.each([
    ["active owner", {}],
    ["superuser", { role: "superuser" as const, ownerId: "someone-else" }],
  ])("keeps hidden notices out of public list and detail for an authenticated %s", async (_name, options) => {
    const { client, notices } = setupClient(options);
    client.rpc.mockResolvedValue({ data: false, error: null });

    await expect(getPublicLoungeNotices(BUSINESS_ID)).resolves.toEqual([]);
    await expect(getPublicLoungeNoticeDetail("test-business", NOTICE_ID)).resolves.toBeNull();
    expect(notices.order).not.toHaveBeenCalled();
    expect(notices.maybeSingle).not.toHaveBeenCalled();
  });

  it("treats duplicate subscribe as success and scopes unsubscribe to user and business", async () => {
    const { subscriptions } = setupClient();
    subscriptions.insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    await expect(subscribeToLoungeNotices(BUSINESS_ID)).resolves.toMatchObject({ success: true });
    await expect(unsubscribeFromLoungeNotices(BUSINESS_ID)).resolves.toMatchObject({ success: true });
    expect(subscriptions.delete).toHaveBeenCalledTimes(1);
    expect(subscriptions.eq).toHaveBeenCalledWith("business_id", BUSINESS_ID);
    expect(subscriptions.eq).toHaveBeenCalledWith("user_id", USER_ID);
  });
});
