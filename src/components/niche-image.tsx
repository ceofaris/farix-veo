import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { signedNicheUrl } from "@/lib/niches";
import { cn } from "@/lib/utils";

/** Renders a signed thumbnail for a niche stored in the private bucket. */
export function NicheImage({
  path,
  alt,
  className,
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const url = useQuery({
    queryKey: ["niche-image", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: () => signedNicheUrl(path),
  });

  if (!path || !url.data) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }
  return <img src={url.data} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
