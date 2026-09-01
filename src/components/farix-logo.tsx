import { cn } from "@/lib/utils";

// Old Farix brand mark has been retired. Brand spots render plain text only.
export function FarixMark({ className }: { className?: string }) {
  return null;
}

export function FarixLogo({
  className,
  markClassName,
  textClassName,
  label = "Farix AI",
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  label?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", textClassName)}>
          {label}
        </span>
      )}
    </div>
  );
}
