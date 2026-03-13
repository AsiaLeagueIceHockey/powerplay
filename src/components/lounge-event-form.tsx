"use client";

import { useTransition } from "react";
import type { LoungeEvent } from "@/app/actions/lounge";
import { createLoungeEvent, deleteLoungeEvent } from "@/app/actions/lounge";

function toLocalInputValue(isoString: string) {
  const date = new Date(isoString);
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

export function LoungeEventForm({ locale, events }: { locale: string; events: LoungeEvent[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "라운지 일정 등록" : "Lounge events"}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {locale === "ko" ? "레슨, 대회, 프로모션 일정을 직접 등록합니다." : "Add lesson, tournament, and promotion schedules."}
        </p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await createLoungeEvent(formData);
            if (!result.success) {
              alert(result.error || (locale === "ko" ? "저장 실패" : "Save failed"));
              return;
            }
            alert(locale === "ko" ? "일정이 추가되었습니다." : "Event created.");
            event.currentTarget.reset();
          });
        }}
      >
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{locale === "ko" ? "제목" : "Title"}</span>
          <input name="title" required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "일정 유형" : "Type"}</span>
          <select name="category" defaultValue="lesson" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950">
            <option value="lesson">{locale === "ko" ? "레슨" : "Lesson"}</option>
            <option value="training">{locale === "ko" ? "훈련" : "Training"}</option>
            <option value="tournament">{locale === "ko" ? "대회" : "Tournament"}</option>
            <option value="promotion">{locale === "ko" ? "프로모션" : "Promotion"}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "시작 일시" : "Start time"}</span>
          <input type="datetime-local" name="start_time" required className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "종료 일시" : "End time"}</span>
          <input type="datetime-local" name="end_time" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "장소" : "Location"}</span>
          <input name="location" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "한 줄 설명" : "Summary"}</span>
          <input name="summary" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "가격" : "Price"}</span>
          <input name="price_krw" inputMode="numeric" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{locale === "ko" ? "정원" : "Capacity"}</span>
          <input name="max_participants" inputMode="numeric" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">{locale === "ko" ? "상세 설명" : "Description"}</span>
          <textarea name="description" rows={4} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
          <input type="checkbox" name="is_published" value="true" defaultChecked />
          {locale === "ko" ? "즉시 공개" : "Publish now"}
        </label>
        <button type="submit" disabled={isPending} className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 md:col-span-2">
          {isPending ? (locale === "ko" ? "저장 중..." : "Saving...") : (locale === "ko" ? "일정 추가" : "Add event")}
        </button>
      </form>

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {locale === "ko" ? "등록된 일정" : "Published events"}
        </h4>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {locale === "ko" ? "아직 등록된 일정이 없습니다." : "No events yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((eventItem) => (
              <div key={eventItem.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{eventItem.title}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{toLocalInputValue(eventItem.start_time).replace("T", " ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await deleteLoungeEvent(eventItem.id);
                      if (!result.success) {
                        alert(result.error || (locale === "ko" ? "삭제 실패" : "Delete failed"));
                        return;
                      }
                      alert(locale === "ko" ? "일정이 삭제되었습니다." : "Event removed.");
                    });
                  }}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900/30 dark:text-red-400"
                >
                  {locale === "ko" ? "삭제" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
