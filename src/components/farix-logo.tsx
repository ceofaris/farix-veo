import { cn } from "@/lib/utils";
import markAsset from "@/assets/farix-mark.png.asset.json";

export function FarixMark({ className }: { className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt="Farix logo"
      className={cn("h-6 w-auto shrink-0 object-contain select-none", className)}
      draggable={false}
    />
  );
}

export function FarixLogo({
  className,
  markClassName,
  textClassName,
  label = "Farix",
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
      <FarixMark className={markClassName} />
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", textClassName)}>
          {label}
        </span>
      )}
    </div>
  );
}
