/** Pure recipes for behavior-owning components that cannot use a shared element. */
export type ButtonVariant = "primary" | "navy" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning" | "cheer" | "points" | "kakao" | "naver";
export type ButtonSize = "compact" | "default" | "large" | "club";
export type ButtonShape = "default" | "circle" | "pill";
export type SurfaceDensity = "none" | "compact" | "default" | "comfortable" | "roomy";
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "cheer";

/** Layout classes may be appended; visual changes belong in a recipe option. */
export function uiClassNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function buttonStyles({ variant = "primary", size = "default", fullWidth = false, shape = "default" }: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; shape?: ButtonShape } = {}) {
  return uiClassNames("pp-button", `pp-button-${variant}`, `pp-button-${size}`, shape !== "default" && `pp-button-${shape}`, fullWidth && "pp-full-width");
}

export function surfaceStyles({ interactive = false, density = "default", tone = "default" }: { interactive?: boolean; density?: SurfaceDensity; tone?: "default" | "muted" } = {}) {
  return uiClassNames("pp-surface", `pp-surface-${density}`, tone === "muted" && "pp-surface-muted-content", interactive && "pp-surface-interactive");
}

export function fieldStyles({ invalid = false, size = "default", leadingIcon = false, multiline = false }: { invalid?: boolean; size?: "compact" | "default"; leadingIcon?: boolean; multiline?: boolean } = {}) {
  return uiClassNames("pp-field", `pp-field-${size}`, invalid && "pp-field-invalid", leadingIcon && "pp-field-leading-icon", multiline && "pp-textarea");
}

export function badgeStyles({ tone = "neutral" }: { tone?: BadgeTone } = {}) {
  return uiClassNames("pp-badge", `pp-badge-${tone}`);
}

export function filterChipStyles({ selected = false, shape = "pill" }: { selected?: boolean; shape?: "pill" | "row" | "date" } = {}) {
  return uiClassNames("pp-filter-chip", shape !== "pill" && `pp-filter-${shape}`, selected && "pp-selected");
}

export function segmentedItemStyles({ selected = false, kind = "switch" }: { selected?: boolean; kind?: "switch" | "tab" } = {}) {
  return uiClassNames("pp-segmented-item", kind === "tab" && "pp-section-tab", selected && "pp-selected");
}

export function overlayStyles({ kind = "modal", density = "none" }: { kind?: "modal" | "sheet"; density?: SurfaceDensity } = {}) {
  return uiClassNames("pp-overlay-surface", `pp-overlay-${kind}`, density !== "none" && `pp-surface-${density}`);
}

export const actionIconClass = "pp-action-icon";
export const actionLabelClass = "pp-action-label";
export const clubActionIconClass = "pp-club-action-icon";
