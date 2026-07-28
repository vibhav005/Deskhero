import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

export interface FieldProps extends InputProps {
  label: string;
  hint?: string;
}

/** Label + Input pair shared across auth forms (previously copy-pasted per page). */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label htmlFor={inputId} className="flex flex-col gap-1.5 text-sm font-medium">
        {label}
        <Input ref={ref} id={inputId} {...rest} />
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
    );
  },
);
Field.displayName = "Field";
