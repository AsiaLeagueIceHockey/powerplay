import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { buttonStyles, uiClassNames, type ButtonShape, type ButtonSize, type ButtonVariant } from "./styles";

type ButtonAppearance = { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; shape?: ButtonShape };
export type ButtonProps = ComponentProps<"button"> & ButtonAppearance & { loading?: boolean };

/** Explicit type=submit at form submission sites; ordinary actions never submit by default. */
export function Button({ variant, size, fullWidth, shape, loading = false, disabled, type = "button", className, "aria-busy": ariaBusy, ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || ariaBusy || undefined} className={uiClassNames(buttonStyles({ variant, size, fullWidth, shape }), className)} />;
}

export type LinkButtonProps = ComponentProps<typeof Link> & ButtonAppearance;
export function LinkButton({ variant, size, fullWidth, shape, className, ...props }: LinkButtonProps) {
  return <Link {...props} className={uiClassNames(buttonStyles({ variant, size, fullWidth, shape }), className)} />;
}

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "fullWidth"> & { label: string };
export function IconButton({ label, variant = "ghost", className, ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} aria-label={label} className={uiClassNames("pp-icon-button", className)} />;
}
