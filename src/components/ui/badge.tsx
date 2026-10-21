import type { ComponentProps } from "react";
import { badgeStyles, uiClassNames, type BadgeTone } from "./styles";

export type BadgeProps = ComponentProps<"span"> & { tone?: BadgeTone };
export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span {...props} className={uiClassNames(badgeStyles({ tone }), className)} />;
}
