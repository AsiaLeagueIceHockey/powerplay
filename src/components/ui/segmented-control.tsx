import type { ComponentProps } from "react";
import { segmentedItemStyles, uiClassNames } from "./styles";

export type SegmentedControlProps = ComponentProps<"div"> & { label: string };
export function SegmentedControl({ label, className, ...props }: SegmentedControlProps) {
  return <div {...props} role="group" aria-label={label} className={uiClassNames("pp-segmented-control", className)} />;
}

export type SegmentedItemProps = ComponentProps<"button"> & { selected?: boolean };
export function SegmentedItem({ selected = false, className, type = "button", ...props }: SegmentedItemProps) {
  return <button {...props} type={type} aria-pressed={selected} className={uiClassNames(segmentedItemStyles({ selected }), className)} />;
}
