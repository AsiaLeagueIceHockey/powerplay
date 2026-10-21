import type { ComponentProps } from "react";
import { filterChipStyles, uiClassNames } from "./styles";

export type FilterChipProps = ComponentProps<"button"> & { selected?: boolean; shape?: "pill" | "row" | "date" };
export function FilterChip({ selected = false, shape, className, type = "button", ...props }: FilterChipProps) {
  return <button {...props} type={type} aria-pressed={selected} className={uiClassNames(filterChipStyles({ selected, shape }), className)} />;
}
