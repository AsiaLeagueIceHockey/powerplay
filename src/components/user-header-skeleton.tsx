export function UserHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
  );
}
