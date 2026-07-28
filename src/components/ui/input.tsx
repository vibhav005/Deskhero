import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full rounded-xl border border-border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        default: "h-11 px-4 text-base",
        sm: "h-10 px-3.5 py-2.5 text-sm",
      },
    },
    defaultVariants: { inputSize: "default" },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize, ...props }, ref) => (
    <input ref={ref} className={cn(inputVariants({ inputSize }), className)} {...props} />
  ),
);
Input.displayName = "Input";
