import { cloneElement, type AriaAttributes, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { fieldStyles, uiClassNames } from "./styles";

type FieldAppearance = { invalid?: boolean; controlSize?: "compact" | "default" };
export type InputProps = ComponentProps<"input"> & FieldAppearance;
export function Input({ className, invalid, controlSize, "aria-invalid": ariaInvalid, ...props }: InputProps) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return <input {...props} aria-invalid={isInvalid || ariaInvalid || undefined} className={uiClassNames(fieldStyles({ invalid: isInvalid, size: controlSize }), className)} />;
}

export type SelectProps = ComponentProps<"select"> & FieldAppearance;
export function Select({ className, invalid, controlSize, "aria-invalid": ariaInvalid, ...props }: SelectProps) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return <select {...props} aria-invalid={isInvalid || ariaInvalid || undefined} className={uiClassNames(fieldStyles({ invalid: isInvalid, size: controlSize }), className)} />;
}

export type TextareaProps = ComponentProps<"textarea"> & FieldAppearance;
export function Textarea({ className, invalid, controlSize, "aria-invalid": ariaInvalid, ...props }: TextareaProps) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return <textarea {...props} aria-invalid={isInvalid || ariaInvalid || undefined} className={uiClassNames(fieldStyles({ invalid: isInvalid, size: controlSize }), "pp-textarea", className)} />;
}

type DescribedControl = ReactElement<AriaAttributes & { id?: string }>;
export type FieldProps = Omit<ComponentProps<"div">, "children"> & {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  children: DescribedControl;
};

/** A single native/shared control, with a stable caller-owned id for accessible messages. */
export function Field({ id, label, help, error, children, className, ...props }: FieldProps) {
  const controlId = children.props.id || id;
  const describedBy = uiClassNames(children.props["aria-describedby"], help != null && `${id}-help`, error != null && `${id}-error`);
  return <div {...props} className={uiClassNames("pp-form-field", className)}>
    <label htmlFor={controlId} className="pp-field-label">{label}</label>
    {cloneElement(children, { id: controlId, "aria-describedby": describedBy || undefined, "aria-invalid": error != null ? true : children.props["aria-invalid"] })}
    {help != null && <div id={`${id}-help`} className="pp-field-help">{help}</div>}
    {error != null && <div id={`${id}-error`} className="pp-field-error" role="alert">{error}</div>}
  </div>;
}
