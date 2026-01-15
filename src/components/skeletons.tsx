// Skeleton Components for Streaming UI

export function MatchListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div className="mb-2 h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mb-3 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex gap-3">
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 h-[400px] flex items-center justify-center">
      <div className="text-zinc-400 dark:text-zinc-600">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span className="text-sm">지도 로딩 중...</span>
      </div>
    </div>
  );
}

export function ClubListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1">
              <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />
              <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
          <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700 mb-3" />
          <div className="h-10 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      ))}
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="flex gap-2 mb-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse h-10 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-8 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(35).fill(0).map((_, i) => (
          <div key={i} className="h-10 rounded bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <TabsSkeleton />
      <MatchListSkeleton />
    </div>
  );
}
