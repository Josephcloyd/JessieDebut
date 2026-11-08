"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import type { GalleryAlbum, GalleryPhoto } from "@/lib/types";
import { Reveal } from "../motion-helpers";
import { GalleryImage } from "./GalleryImage";
import { Lightbox } from "./Lightbox";
import { Slideshow } from "./Slideshow";

const FEATURE_LAYOUT = ["arch col-span-3 row-span-2 aspect-[3/4] md:aspect-auto", "col-span-2 aspect-square md:aspect-auto md:translate-y-8", "col-span-2 aspect-[4/5] md:aspect-auto md:translate-y-8"];
const WAITING_ARCHES = ["h-44 md:h-80", "h-60 md:h-[26rem]", "h-44 md:h-80"];

interface GalleryProps {
  albums: GalleryAlbum[];
  autoplay: boolean;
  intervalSeconds: number;
}

export function Gallery({ albums, autoplay, intervalSeconds }: GalleryProps) {
  const [albumId, setAlbumId] = useState(albums[0]?.id);
  const [viewer, setViewer] = useState<{ photos: GalleryPhoto[]; index: number } | null>(null);
  const closeViewer = useCallback(() => setViewer(null), []);
  const featured = useMemo(() => albums.flatMap((album) => album.photos.filter((photo) => photo.isFeatured)).slice(0, 3), [albums]);
  const album = albums.find((item) => item.id === albumId) ?? albums[0];

  return (
    <section id="gallery" className="px-5 pt-20 md:pt-32">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="font-display text-6xl font-light leading-none md:text-8xl">The Gallery</h2>
      </Reveal>
      {!album ? (
        <Reveal className="mx-auto mt-10 max-w-4xl">
          <div className="flex items-end justify-center gap-3 md:gap-6" aria-hidden="true">
            {WAITING_ARCHES.map((size, index) => <div key={index} className={`arch flex-1 border border-gold bg-beige/30 ${size}`} />)}
          </div>
          <p className="mt-6 text-center font-script text-4xl leading-tight md:text-5xl">Photographs are coming soon</p>
        </Reveal>
      ) : (
        <div className="mx-auto mt-10 max-w-6xl md:mt-14">
          {featured.length > 0 && (
            <div className="mb-14 grid grid-cols-5 gap-3 md:mb-24 md:h-[36rem] md:grid-rows-2 md:gap-5">
              {featured.map((photo, index) => (
                <button key={photo.id} type="button" onClick={() => setViewer({ photos: featured, index })} aria-label={`View ${photo.caption || "featured photo"}`} className={`group relative overflow-hidden ${FEATURE_LAYOUT[index]}`}>
                  <span className="absolute inset-0 block transition-transform duration-700 group-hover:scale-105">
                    <GalleryImage photo={photo} sizes="(min-width: 768px) 50vw, 100vw" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {albums.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-x-7 gap-y-1" role="tablist" aria-label="Gallery albums">
              {albums.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={item.id === album.id} onClick={() => setAlbumId(item.id)} className={`min-h-11 border-b pb-1 font-display text-2xl italic transition-colors ${item.id === album.id ? "border-umber text-umber" : "border-transparent text-soft-ink hover:text-umber"}`}>
                  {item.name}
                </button>
              ))}
            </div>
          )}

          {album.description && <p className="mb-6 max-w-2xl font-display text-xl italic text-soft-ink">{album.description}</p>}

          <Reveal>
            <Slideshow key={album.id} photos={album.photos} autoplay={autoplay} intervalSeconds={intervalSeconds} isPaused={viewer !== null} onExpand={(index) => setViewer({ photos: album.photos, index })} />
          </Reveal>
        </div>
      )}
      <AnimatePresence>
        {viewer && <Lightbox photos={viewer.photos} startIndex={viewer.index} onClose={closeViewer} />}
      </AnimatePresence>
    </section>
  );
}
