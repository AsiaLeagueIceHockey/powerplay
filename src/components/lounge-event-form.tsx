"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarRange, Loader2, MapPin, Search } from "lucide-react";
import { parseNaverMapUrl } from "@/app/actions/admin";
import type { LoungeEvent } from "@/app/actions/lounge";
import { deleteLoungeEvent, upsertLoungeEvent } from "@/app/actions/lounge";

function toLocalInputValue(isoString: string) {
  const date = new Date(isoString);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

function formatEventTime(isoString: string) {
  return toLocalInputValue(isoString).replace("T", " ");
}

const emptyForm = {
  event_id: "",
  title: "",
  category: "lesson",
  start_time: "",
  end_time: "",
  location: "",
  location_address: "",
  location_map_url: "",
  location_lat: "",
  location_lng: "",
  summary: "",
  price_krw: "",
  max_participants: "",
  description: "",
  display_priority: "0",
  is_published: true,
};

export function LoungeEventForm({ locale, events }: { locale: string; events: LoungeEvent[] }) {
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState(emptyForm);
  const [parsing, setParsing] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (b.display_priority !== a.display_priority) {
          return b.display_priority - a.display_priority;
        }
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }),
    [events]
  );

  const isEditing = !!formState.event_id;

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-[linear-gradient(180deg,#f5f5f4_0%,#ffffff_100%)] p-6 shadow-sm dark:border-zinc-800 dark:bg-[linear-gradient(180deg,#18181b_0%,#0f172a_100%)]">
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "라운지 일정 관리" : "Lounge events"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {locale === "ko"
            ? "레슨, 대회, 프로모션 일정을 등록하고 수정합니다."
            : "Create and edit lesson, tournament, and promotion schedules."}
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950"
        onSubmit={(event) => {
          event.preventDefault();
          const payload = new FormData();

          Object.entries(formState).forEach(([key, value]) => {
            payload.set(key, typeof value === "boolean" ? String(value) : value);
          });

          startTransition(async () => {
            const result = await upsertLoungeEvent(payload);
            if (!result.success) {
              alert(result.error || (locale === "ko" ? "저장 실패" : "Save failed"));
              return;
            }

            alert(
              isEditing
                ? locale === "ko"
                  ? "일정이 수정되었습니다."
                  : "Event updated."
                : locale === "ko"
                  ? "일정이 추가되었습니다."
                  : "Event created."
            );
            setFormState(emptyForm);
          });
        }}
      >
        <input type="hidden" name="event_id" value={formState.event_id} />

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "제목" : "Title"}</span>
          <input
            name="title"
            required
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "일정 유형" : "Type"}</span>
          <select
            name="category"
            value={formState.category}
            onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="lesson">{locale === "ko" ? "레슨" : "Lesson"}</option>
            <option value="training">{locale === "ko" ? "훈련" : "Training"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="promotion">{locale === "ko" ? "프로모션" : "Promotion"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "노출 우선순위" : "Display priority"}</span>
          <input
            name="display_priority"
            inputMode="numeric"
            value={formState.display_priority}
            onChange={(event) => setFormState((prev) => ({ ...prev, display_priority: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "시작 일시" : "Start time"}</span>
          <input
            type="datetime-local"
            name="start_time"
            required
            value={formState.start_time}
            onChange={(event) => setFormState((prev) => ({ ...prev, start_time: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "종료 일시" : "End time"}</span>
          <input
            type="datetime-local"
            name="end_time"
            value={formState.end_time}
            onChange={(event) => setFormState((prev) => ({ ...prev, end_time: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "장소" : "Location"}</span>
          <input
            name="location"
            value={formState.location}
            onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <div className="space-y-3 md:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {locale === "ko" ? "이 일정의 위치" : "Event location"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {locale === "ko"
                ? "이벤트가 열리는 실제 위치를 지도 기반으로 등록합니다."
                : "Register the actual event location with map metadata."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="url"
              value={formState.location_map_url}
              onChange={(event) => setFormState((prev) => ({ ...prev, location_map_url: event.target.value }))}
              placeholder="https://naver.me/..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={async () => {
                if (!formState.location_map_url) {
                  setMapError(locale === "ko" ? "네이버 지도 URL을 입력하세요." : "Enter a Naver Map URL.");
                  return;
                }
                setParsing(true);
                setMapError(null);
                const result = await parseNaverMapUrl(formState.location_map_url);
                if (!result.success || !result.data) {
                  setMapError(result.error || (locale === "ko" ? "지도 정보를 가져오지 못했습니다." : "Failed to parse map URL."));
                  setParsing(false);
                  return;
                }
                setFormState((prev) => ({
                  ...prev,
                  location_map_url: result.data!.mapUrl,
                  location_address: result.data!.address,
                  location_lat: result.data!.lat.toString(),
                  location_lng: result.data!.lng.toString(),
                  location: prev.location || result.data!.name || "",
                }));
                setParsing(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {locale === "ko" ? "정보 가져오기" : "Fetch info"}
            </button>
          </div>
          {mapError ? <p className="text-sm text-red-600 dark:text-red-400">{mapError}</p> : null}
          <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{formState.location_address || (locale === "ko" ? "주소 미등록" : "No address yet")}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formState.location_lat && formState.location_lng
                  ? `${formState.location_lat}, ${formState.location_lng}`
                  : (locale === "ko" ? "좌표 미등록" : "No coordinates yet")}
              </p>
            </div>
          </div>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "한 줄 설명" : "Summary"}</span>
          <input
            name="summary"
            value={formState.summary}
            onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "가격" : "Price"}</span>
          <input
            name="price_krw"
            inputMode="numeric"
            value={formState.price_krw}
            onChange={(event) => setFormState((prev) => ({ ...prev, price_krw: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "정원" : "Capacity"}</span>
          <input
            name="max_participants"
            inputMode="numeric"
            value={formState.max_participants}
            onChange={(event) => setFormState((prev) => ({ ...prev, max_participants: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{locale === "ko" ? "상세 설명" : "Description"}</span>
          <textarea
            name="description"
            rows={4}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 md:col-span-2">
          <input
            type="checkbox"
            checked={formState.is_published}
            onChange={(event) => setFormState((prev) => ({ ...prev, is_published: event.target.checked }))}
          />
          {locale === "ko" ? "즉시 공개" : "Publish now"}
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending
              ? locale === "ko"
                ? "저장 중..."
                : "Saving..."
              : isEditing
                ? locale === "ko"
                  ? "일정 수정"
                  : "Update event"
                : locale === "ko"
                  ? "일정 추가"
                  : "Add event"}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => setFormState(emptyForm)}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {locale === "ko" ? "새 일정으로 초기화" : "Reset to new"}
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "등록된 일정" : "Published events"}
        </h4>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {locale === "ko" ? "아직 등록된 일정이 없습니다." : "No events yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((eventItem) => (
              <div key={eventItem.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{eventItem.title}</p>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {locale === "ko" ? `우선순위 ${eventItem.display_priority}` : `Priority ${eventItem.display_priority}`}
                      </span>
                      {!eventItem.is_published ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          {locale === "ko" ? "비공개" : "Unpublished"}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatEventTime(eventItem.start_time)}</p>
                    {eventItem.location ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{eventItem.location}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({
                          event_id: eventItem.id,
                          title: eventItem.title,
                          category: eventItem.category,
                          start_time: toLocalInputValue(eventItem.start_time),
                          end_time: eventItem.end_time ? toLocalInputValue(eventItem.end_time) : "",
                          location: eventItem.location ?? "",
                          location_address: eventItem.location_address ?? "",
                          location_map_url: eventItem.location_map_url ?? "",
                          location_lat: eventItem.location_lat?.toString() ?? "",
                          location_lng: eventItem.location_lng?.toString() ?? "",
                          summary: eventItem.summary ?? "",
                          price_krw: eventItem.price_krw?.toString() ?? "",
                          max_participants: eventItem.max_participants?.toString() ?? "",
                          description: eventItem.description ?? "",
                          display_priority: eventItem.display_priority.toString(),
                          is_published: eventItem.is_published,
                        })
                      }
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      {locale === "ko" ? "수정" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        startTransition(async () => {
                          const result = await deleteLoungeEvent(eventItem.id);
                          if (!result.success) {
                            alert(result.error || (locale === "ko" ? "삭제 실패" : "Delete failed"));
                            return;
                          }
                          if (formState.event_id === eventItem.id) {
                            setFormState(emptyForm);
                          }
                          alert(locale === "ko" ? "일정이 삭제되었습니다." : "Event removed.");
                        });
                      }}
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900/30 dark:text-red-400"
                    >
                      {locale === "ko" ? "삭제" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
