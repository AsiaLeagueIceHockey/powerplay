import type { ComponentProps } from "react";
import { surfaceStyles, uiClassNames, type SurfaceDensity } from "./styles";

export type SurfaceProps = ComponentProps<"div"> & { interactive?: boolean; density?: SurfaceDensity; tone?: "default" | "muted" };
/** Use the recipe on a real link/button when a card itself is actionable. */
export function Surface({ interactive, density, tone, className, ...props }: SurfaceProps) {
  return <div {...props} className={uiClassNames(surfaceStyles({ interactive, density, tone }), className)} />;
}
