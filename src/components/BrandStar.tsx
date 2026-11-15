import { cn } from "@/lib/utils";

/**
 * The four-point star of the LUNAVI logo. It marks what the AI wrote and what is new, one per
 * screen, in black or in white on black (brand guide v1.0, section 05).
 */
export default function BrandStar({ className }: { className?: string }) {
  return (
    <svg className={cn("size-3 shrink-0 fill-current", className)} viewBox="360 56 124 124" aria-hidden="true">
      <path d="M424,56 C428.2,108.8 433.0,113.8 484,118 C433.0,122.2 428.2,127.2 424,180 C419.8,127.2 414.7,122.2 360,118 C414.7,113.8 419.8,108.8 424,56 Z" />
    </svg>
  );
}
