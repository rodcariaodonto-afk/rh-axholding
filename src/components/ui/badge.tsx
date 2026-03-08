import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Colored outline variants (matching reference design)
        success: "border-status-success bg-status-success/10 text-status-success dark:bg-transparent",
        warning: "border-status-warning bg-status-warning/10 text-status-warning dark:bg-transparent",
        error: "border-status-error bg-status-error/10 text-status-error dark:bg-transparent",
        info: "border-status-info bg-status-info/10 text-status-info dark:bg-transparent",
        neutral: "border-status-neutral bg-status-neutral/10 text-status-neutral dark:bg-transparent",
        purple: "border-status-purple bg-status-purple/10 text-status-purple dark:bg-transparent",
        orange: "border-status-orange bg-status-orange/10 text-status-orange dark:bg-transparent",
        teal: "border-status-teal bg-status-teal/10 text-status-teal dark:bg-transparent",
        cyan: "border-status-cyan bg-status-cyan/10 text-status-cyan dark:bg-transparent",
        amber: "border-status-amber bg-status-amber/10 text-status-amber dark:bg-transparent",
        slate: "border-status-slate bg-status-slate/10 text-status-slate dark:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
