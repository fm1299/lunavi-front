import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-3 rounded-xl border bg-background/40 p-4", className)} {...props} />;
}

function CardLabel({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export { Card, CardLabel };
