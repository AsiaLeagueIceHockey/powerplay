export const LOUNGE_NOTICE_TITLE_MAX_LENGTH = 120;
export const LOUNGE_NOTICE_BODY_MAX_LENGTH = 10_000;
export const LOUNGE_NOTICE_FANOUT_BATCH_SIZE = 25;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface LoungeNotice {
  id: string;
  business_id: string;
  title: string;
  body: string;
  created_by: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  business?: {
    id?: string;
    slug: string;
    name: string;
    is_published?: boolean;
  } | null;
}

export type LoungeNoticeInputResult =
  | { ok: true; title: string; body: string }
  | { ok: false; error: string };

export interface PushDeliveryResult {
  success: boolean;
  sent?: number;
  error?: string;
}

export interface LoungeNoticeFanoutSummary {
  intendedUsers: number;
  successfulUsers: number;
  devicesSent: number;
  noSubscription: number;
  rejected: number;
  handledFailures: number;
  elapsedMs: number;
}

export function validateLoungeNoticeInput(
  rawTitle: string,
  rawBody: string
): LoungeNoticeInputResult {
  const title = rawTitle.trim();
  const body = rawBody.trim();

  if (!title) return { ok: false, error: "Title is required" };
  if (!body) return { ok: false, error: "Body is required" };
  if (title.length > LOUNGE_NOTICE_TITLE_MAX_LENGTH) {
    return { ok: false, error: `Title must be ${LOUNGE_NOTICE_TITLE_MAX_LENGTH} characters or fewer` };
  }
  if (body.length > LOUNGE_NOTICE_BODY_MAX_LENGTH) {
    return { ok: false, error: `Body must be ${LOUNGE_NOTICE_BODY_MAX_LENGTH} characters or fewer` };
  }

  return { ok: true, title, body };
}

export function isValidRequestId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function buildLoungeNoticeDetailPath(
  locale: "ko" | "en",
  businessSlug: string,
  noticeId: string
): string {
  return `/${locale}/lounge/${businessSlug}/notices/${noticeId}`;
}

export async function fanOutLoungeNotice(
  subscriberIds: string[],
  publisherId: string,
  send: (userId: string) => Promise<PushDeliveryResult>,
  now: () => number = Date.now
): Promise<LoungeNoticeFanoutSummary> {
  const startedAt = now();
  const recipients = Array.from(new Set(subscriberIds)).filter(
    (userId) => userId && userId !== publisherId
  );
  const summary: LoungeNoticeFanoutSummary = {
    intendedUsers: recipients.length,
    successfulUsers: 0,
    devicesSent: 0,
    noSubscription: 0,
    rejected: 0,
    handledFailures: 0,
    elapsedMs: 0,
  };

  for (let offset = 0; offset < recipients.length; offset += LOUNGE_NOTICE_FANOUT_BATCH_SIZE) {
    const batch = recipients.slice(offset, offset + LOUNGE_NOTICE_FANOUT_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((userId) => send(userId)));

    for (const result of results) {
      if (result.status === "rejected") {
        summary.rejected += 1;
      } else if (result.value.success) {
        summary.successfulUsers += 1;
        summary.devicesSent += result.value.sent ?? 0;
      } else if (result.value.error === "No subscriptions") {
        summary.noSubscription += 1;
      } else {
        summary.handledFailures += 1;
      }
    }
  }

  summary.elapsedMs = Math.max(0, now() - startedAt);
  return summary;
}
