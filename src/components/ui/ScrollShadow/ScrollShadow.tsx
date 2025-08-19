"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollShadowProps {
  className?: string;
  scrollableClassName?: string;
  children: React.ReactNode;
}

export const ScrollShadow = React.forwardRef<HTMLDivElement, ScrollShadowProps>(
  ({ className, scrollableClassName, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div
          className={cn("overflow-auto", scrollableClassName)}
          data-scrollable
        >
          {children}
        </div>
      </div>
    );
  }
);

ScrollShadow.displayName = "ScrollShadow";