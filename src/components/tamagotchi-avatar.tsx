import type { CSSProperties } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { TamagotchiPart } from "@/lib/tamagotchi-palette";
import type { TamagotchiPetColors } from "@/lib/tamagotchi-types";

export type TamagotchiAvatarAction = "idle" | "feed" | "train";

interface TamagotchiAvatarProps {
  /** Render box edge in CSS pixels (square). */
  size: number;
  /** Per-part hex colors (must come from palette whitelist). */
  colors: TamagotchiPetColors;
  /** Display variant. Each action ships its own base + mask asset set. */
  action?: TamagotchiAvatarAction;
  /** Localized alt text exposed via aria-label on the wrapper. */
  alt: string;
  /** Currently unused; preserved for API compatibility while priority preload is handled separately. */
  priority?: boolean;
  /** When provided, the avatar renders as a button. Tap cycles to next action pose. */
  onTap?: () => void;
  className?: string;
}

const PARTS: readonly TamagotchiPart[] = ["helmet", "jersey", "skate"] as const;

/**
 * Pixel-art tamagotchi avatar.
 *
 * Both the base and mask layers render as positioned `<div>`s so they share
 * the exact same box model — avoids the ~0.5px baseline shift seen when
 * mixing `<img>` (inline) with `<div>` (block) under `position: absolute`.
 *
 * All actions (idle / feed / train) composite base + 3 masks. Each action
 * has its own asset set: `{action}_base.png`, `{action}_{part}_mask.png`.
 * Every layer uses `image-rendering: pixelated` to preserve hard edges.
 *
 * When `onTap` is provided, the avatar renders as a `<button>` with a small
 * switch-cue badge in the corner, signaling that taps cycle through poses.
 */
export function TamagotchiAvatar({
  size,
  colors,
  action = "idle",
  alt,
  onTap,
  className,
}: TamagotchiAvatarProps) {
  const containerStyle: CSSProperties = {
    width: size,
    height: size,
  };

  const baseStyle: CSSProperties = {
    backgroundImage: `url(/tamagotchi/${action}_base.png)`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    imageRendering: "pixelated",
  };

  const masks = PARTS.map((part) => {
    const maskUrl = `/tamagotchi/${action}_${part}_mask.png`;
    const maskStyle: CSSProperties = {
      maskImage: `url(${maskUrl})`,
      WebkitMaskImage: `url(${maskUrl})`,
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
      backgroundColor: colors[part],
      imageRendering: "pixelated",
    };
    return (
      <div
        key={part}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={maskStyle}
      />
    );
  });

  if (onTap) {
    // Cue badge size scales gently with avatar size, never below 14px.
    const cueSize = Math.max(14, Math.round(size * 0.1));
    const iconSize = Math.max(10, Math.round(cueSize * 0.55));
    return (
      <button
        type="button"
        onClick={onTap}
        aria-label={alt}
        className={`group relative cursor-pointer border-0 bg-transparent p-0 transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${className ?? ""}`}
        style={containerStyle}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 select-none"
          style={baseStyle}
        />
        {masks}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-transform duration-150 ease-out group-hover:scale-110 dark:bg-zinc-800/95 dark:text-zinc-200 dark:ring-zinc-700"
          style={{ width: cueSize, height: cueSize }}
        >
          <ArrowLeftRight style={{ width: iconSize, height: iconSize }} strokeWidth={2.5} />
        </span>
      </button>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`} style={containerStyle}>
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 select-none"
        style={baseStyle}
      />
      {masks}
    </div>
  );
}
