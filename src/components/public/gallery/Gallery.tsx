"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import type { GalleryAlbum, GalleryPhoto } from "@/lib/types";
import { Reveal } from "../motion-helpers";
import { SectionHeading } from "../SectionHeading";
import { GalleryImage } from "./GalleryImage";
import { Lightbox } from "./Lightbox";
import { Slideshow } from "./Slideshow";

const FEATURE_LAYOUT = ["col-span-2 row-span-2 aspect-square md:aspect-auto", "aspect-[4/5] md:aspect-auto", "aspect-[4/5] md:aspect-auto"];

interface GalleryProps {
  folio: string;
  albums: GalleryAlbum[];
  autoplay: boolean;
  intervalSeconds: number;
}

export function Gallery({ folio, albums, autoplay, intervalSeconds }: GalleryProps) {
  const [albumId, setAlbumId] = useState(albums[0]?.id);
  const [viewer, setViewer] = useState<{ photos: GalleryPhoto[]; index: number } | null>(null);
  const closeViewer = useCallback(() => setViewer(null), []);
  const featured = useMemo(() => albums.flatMap((album) => album.photos.filter((photo) => photo.isFeatured)).slice(0, 3), [albums]);
  const album = albums.find((item) => item.id === albumId) ?? albums[0];

  return (
    <section id="gallery" className="px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="The Gallery" />
      {!album ? (
        <p className="text-center font-display text-2xl italic text-soft-ink">Photographs are coming soon.</p>
      ) : (
        <div className="mx-auto max-w-6xl">
          {featured.length > 0 && (
            <div className="mb-14 grid grid-cols-2 gap-3 md:h-[34rem] md:grid-cols-3 md:grid-rows-2">
              {featured.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setViewer({ photos: featured, index })}
                  aria-label={`View ${photo.caption || "featured photo"}`}
                  className={`group relative overflow-hidden ${FEATURE_LAYOUT[index]}`}
                >
                  <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-105">
                    <GalleryImage photo={photo} sizes="(min-width: 768px) 50vw, 100vw" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {albums.length > 1 && (
            <div className="no-scrollbar mb-8 flex gap-6 overflow-x-auto border-b border-champagne/60 md:justify-center" role="tablist" aria-label="Gallery albums">
              {albums.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === album.id}
                  onClick={() => setAlbumId(item.id)}
                  className={`min-h-11 shrink-0 border-b pb-2 font-display text-xl italic transition-colors ${item.id === album.id ? "border-umber text-umber" : "border-transparent text-soft-ink hover:text-umber"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {album.description && <p className="mb-6 text-center text-soft-ink">{album.description}</p>}

          <Reveal>
          <Slideshow
            key={album.id}
            photos={album.photos}
            autoplay={autoplay}
            intervalSeconds={intervalSeconds}
            isPaused={viewer !== null}
            onExpand={(index) => setViewer({ photos: album.photos, index })}
          />
          </Reveal>
        </div>
      )}
      <AnimatePresence>
        {viewer && <Lightbox photos={viewer.photos} startIndex={viewer.index} onClose={closeViewer} />}
      </AnimatePresence>
    </section>
  );
}
