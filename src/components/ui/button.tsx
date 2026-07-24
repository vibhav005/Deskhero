"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-glow-primary hover:shadow-glow-primary-lg hover:brightness-105",
        accent:
          "bg-gradient-to-b from-accent to-accent/85 text-accent-foreground shadow-glow-accent hover:brightness-105",
        secondary:
          "border border-border bg-muted text-foreground hover:bg-muted/70",
        outline:
          "border border-border bg-surface text-foreground hover:border-primary/40 hover:bg-muted/50",
        ghost: "text-foreground hover:bg-muted/60",
        success:
          "bg-gradient-to-b from-success to-success/85 text-success-foreground shadow-glow-success hover:brightness-105",
        subtle: "border border-primary/20 bg-primary-soft text-primary hover:brightness-125",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
        pill: "h-8 rounded-full px-4 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
