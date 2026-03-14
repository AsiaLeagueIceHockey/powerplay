export const loungeIceGoldTheme = {
  bannerContainer:
    "overflow-hidden rounded-xl border border-[#d4a017]/25 bg-[radial-gradient(circle_at_top_right,_rgba(243,210,122,0.24),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#d4a017_140%)] px-4 py-3 shadow-sm",
  bannerIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-[#f3d27a] backdrop-blur",
  accentLine:
    "bg-[linear-gradient(90deg,#0f172a_0%,#1e293b_45%,#d4a017_100%)]",
  badge:
    "bg-[#fbf4dd] text-[#8b6814] dark:bg-[#d4a017]/15 dark:text-[#f3d27a]",
  subtleBadge:
    "bg-[#fbf4dd] text-[#7a5a10] dark:bg-[#d4a017]/12 dark:text-[#f3d27a]",
  categoryChip:
    "border-[#edd899] bg-[#fdf7e6] text-[#8a6610] dark:border-[#d4a017]/30 dark:bg-[#d4a017]/12 dark:text-[#f3d27a]",
  hoverBorder: "hover:border-[#d4a017] dark:hover:border-[#d4a017]",
  highlightState:
    "border-[#d4a017] ring-2 ring-[#f3d27a]/60 shadow-lg shadow-[#d4a017]/10 animate-[pulse_1.8s_ease-in-out_3] dark:border-[#d4a017] dark:ring-[#d4a017]/30",
  timeText: "text-[#a17610] dark:text-[#f3d27a]",
  detailShell:
    "border-[#d4a017]/35 bg-white shadow-sm dark:border-[#d4a017]/20 dark:bg-zinc-950",
  fallbackCover:
    "bg-[radial-gradient(circle_at_top_left,_rgba(243,210,122,0.32),_transparent_36%),linear-gradient(135deg,#fff8eb_0%,#ffffff_52%,#f8f1da_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(243,210,122,0.16),_transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_70%,#2b2414_100%)]",
  shareHover: "hover:text-[#d4a017] dark:hover:text-[#f3d27a]",
  calendarSelected: "bg-[#d4a017] text-[#111827] font-bold shadow-lg",
  calendarToday: "bg-[#0f172a] text-white font-bold",
  calendarHasEvent:
    "bg-[#fcf5de] hover:bg-[#f7ebc7] dark:bg-[#d4a017]/12 dark:hover:bg-[#d4a017]/20",
  calendarEventCount: "text-[#a17610] dark:text-[#f3d27a]",
  dateFilterSelected: "bg-[#d4a017] text-[#111827] shadow-lg",
  dateFilterSelectedSubtext: "text-[#1f2937]/70",
  dateFilterTodayText: "text-[#a17610] dark:text-[#f3d27a] font-semibold",
} as const;
