import Image from "next/image";
import type { GalleryPhoto } from "@/lib/types";

interface GalleryImageProps {
  photo: GalleryPhoto;
  sizes: string;
  fit?: "cover" | "contain";
  priority?: boolean;
}

export function GalleryImage({ photo, sizes, fit = "cover", priority = false }: GalleryImageProps) {
  return (
    <Image
      src={photo.src}
      alt={photo.caption || "Photograph from the gallery"}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={photo.isSigned}
      placeholder={photo.blurDataUrl ? "blur" : "empty"}
      blurDataURL={photo.blurDataUrl ?? undefined}
      className={fit === "cover" ? "object-cover" : "object-contain"}
    />
  );
}
