import type { ComponentProps } from "react";
import { overlayStyles, uiClassNames, type SurfaceDensity } from "./styles";

export type OverlaySurfaceProps = ComponentProps<"div"> & { titleId: string; density?: SurfaceDensity };
/** Presentation only. The owning dialog keeps its backdrop, focus and open/close behavior. */
export function ModalSurface({ titleId, className, density, ...props }: OverlaySurfaceProps) {
  return <div {...props} role="dialog" aria-modal="true" aria-labelledby={titleId} className={uiClassNames(overlayStyles({ density }), className)} />;
}

export function SheetSurface({ titleId, className, density, ...props }: OverlaySurfaceProps) {
  return <div {...props} role="dialog" aria-modal="true" aria-labelledby={titleId} className={uiClassNames(overlayStyles({ kind: "sheet", density }), className)} />;
}
