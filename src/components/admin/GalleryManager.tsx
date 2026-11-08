"use client";

import { Eye, EyeOff, ImagePlus, Pencil, Play, Plus, RefreshCw, Sparkles, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { Slideshow } from "@/components/public/gallery/Slideshow";
import { createAlbum, deleteAlbum, deletePhoto, registerPhoto, replacePhoto, setHeroFromPhoto, updateAlbum, updatePhoto } from "@/lib/actions/admin-gallery";
import { saveControls } from "@/lib/actions/admin-settings";
import { IMAGE_ACCEPT } from "@/lib/domain/upload-rules";
import type { AlbumRow, AlbumVisibility, GalleryPhoto, PhotoRow, SiteControls } from "@/lib/types";
import { Modal, useActionRunner, useFeedback } from "./feedback";
import { EmptyState, PageTitle, Panel, TextInput, Toggle } from "./fields";
import { SortableList } from "./SortableList";
import { uploadAlbumPhoto } from "./upload";

const VISIBILITY_LABEL: Record<AlbumVisibility, string> = {
  public: "Public",
  guests: "Invited guests only",
  hidden: "Hidden",
};

interface GalleryManagerProps {
  albums: AlbumRow[];
  photos: PhotoRow[];
  photoUrls: Record<string, string>;
  controls: SiteControls;
}

export function GalleryManager({ albums, photos, photoUrls, controls }: GalleryManagerProps) {
  const [selectedId, setSelectedId] = useState(albums[0]?.id);
  const [albumForm, setAlbumForm] = useState<AlbumRow | "new" | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const album = albums.find((item) => item.id === selectedId) ?? albums[0];
  const albumPhotos = album ? photos.filter((photo) => photo.album_id === album.id) : [];
  const toSlides = (): GalleryPhoto[] =>
    albumPhotos.filter((photo) => photo.is_visible).map((photo) => ({
      id: photo.id, src: photoUrls[photo.id], caption: photo.caption, width: photo.width, height: photo.height,
      blurDataUrl: photo.blur_data_url, isFeatured: photo.is_featured, isSigned: true,
    }));

  return (
    <>
      <PageTitle title="Gallery" description="Photos appear on the invitation as soon as they finish uploading." actions={<button type="button" className="btn btn-line" onClick={() => setAlbumForm("new")}><Plus className="size-4" /> New Album</button>} />
      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-5">
          <Panel title="Albums">
            {albums.length === 0 ? <EmptyState>Create your first album.</EmptyState> : (
              <SortableList items={albums} table="gallery_albums" renderItem={(item, handle) => (
                <div className={`flex items-center ${item.id === album?.id ? "bg-beige" : ""}`}>
                  {handle}
                  <button type="button" onClick={() => setSelectedId(item.id)} className="min-h-11 min-w-0 flex-1 py-1 text-left text-sm">
                    <span className="block truncate">{item.name}</span>
                    <span className="block text-xs text-soft-ink">{VISIBILITY_LABEL[item.visibility]}, {photos.filter((photo) => photo.album_id === item.id).length} photos</span>
                  </button>
                  <button type="button" aria-label={`Edit ${item.name}`} onClick={() => setAlbumForm(item)} className="flex size-10 items-center justify-center text-soft-ink"><Pencil className="size-4" /></button>
                </div>
              )} />
            )}
          </Panel>
          <SlideshowSettings controls={controls} />
        </div>
        <div>
          {album ? (
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-editorial text-xl">{album.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {albumPhotos.length > 0 && <button type="button" className="btn btn-line !min-h-10 !px-3 !py-2" onClick={() => setIsPreviewOpen(true)}><Play className="size-4" /> Preview Slideshow</button>}
                  <UploadButton albumId={album.id} />
                </div>
              </div>
              {albumPhotos.length === 0 ? <EmptyState>Upload photos to fill this album.</EmptyState> : (
                <SortableList key={album.id} items={albumPhotos} table="gallery_photos" layout="grid" className="grid grid-cols-2 gap-3 md:grid-cols-3" renderItem={(photo, handle) => <PhotoCard photo={photo} url={photoUrls[photo.id]} handle={handle} />} />
              )}
            </Panel>
          ) : <EmptyState>Create an album to begin.</EmptyState>}
        </div>
      </div>
      {albumForm && <AlbumForm album={albumForm === "new" ? null : albumForm} onClose={() => setAlbumForm(null)} />}
      {isPreviewOpen && toSlides().length > 0 && (
        <Modal title={`${album?.name} slideshow`} wide onClose={() => setIsPreviewOpen(false)}>
          <Slideshow photos={toSlides()} autoplay={controls.slideshow_autoplay} intervalSeconds={controls.slideshow_interval_seconds} isPaused={false} onExpand={() => undefined} />
        </Modal>
      )}
    </>
  );
}

function UploadButton({ albumId }: { albumId: string }) {
  const { notify } = useFeedback();
  const { run } = useActionRunner();
  const [status, setStatus] = useState<string>();

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    let failures = 0;
    for (const [index, file] of files.entries()) {
      setStatus(`Uploading ${index + 1} of ${files.length}`);
      try {
        const registration = await uploadAlbumPhoto(file, albumId);
        const result = await run(() => registerPhoto(albumId, registration));
        if (!result.ok) failures += 1;
      } catch (error) {
        failures += 1;
        notify(error instanceof Error ? error.message : `Couldn't upload ${file.name}.`, true);
      }
    }
    setStatus(undefined);
    if (files.length > 0 && failures === 0) notify(files.length === 1 ? "Photo added." : `${files.length} photos added.`);
  };

  return (
    <label className={`btn btn-solid !min-h-10 !px-3 !py-2 ${status ? "pointer-events-none opacity-70" : ""}`}>
      <ImagePlus className="size-4" /> {status ?? "Upload Photos"}
      <input type="file" multiple accept={IMAGE_ACCEPT} className="sr-only" onChange={upload} disabled={Boolean(status)} />
    </label>
  );
}

const ICON_BUTTON = "flex size-9 items-center justify-center hover:bg-beige";

function PhotoCard({ photo, url, handle }: { photo: PhotoRow; url: string; handle: React.ReactNode }) {
  const { confirm, notify } = useFeedback();
  const { run } = useActionRunner();
  const [caption, setCaption] = useState(photo.caption);
  const [isReplacing, setIsReplacing] = useState(false);

  const replace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsReplacing(true);
    try {
      const registration = await uploadAlbumPhoto(file, photo.album_id);
      await run(() => replacePhoto(photo.id, registration), "Photo replaced.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't replace that photo.", true);
    } finally {
      setIsReplacing(false);
    }
  };

  const remove = async () => {
    const isConfirmed = await confirm({ title: "Remove this photo?", body: "It will be permanently deleted from the gallery.", confirmLabel: "Remove" });
    if (isConfirmed) await run(() => deletePhoto(photo.id), "Photo removed.");
  };

  const saveCaption = () => {
    if (caption !== photo.caption) void run(() => updatePhoto(photo.id, { caption }), "Caption saved.");
  };

  return (
    <div className={`border border-beige bg-ivory ${photo.is_visible ? "" : "opacity-60"}`}>
      <div className="relative aspect-square">
        <Image src={url} alt={photo.caption || "Gallery photo"} fill unoptimized className="object-cover" />
        {isReplacing && <span className="absolute inset-0 flex items-center justify-center bg-umber/50 text-xs text-ivory">Replacing</span>}
        {photo.is_featured && <Star className="absolute left-2 top-2 size-5 fill-gold text-white" />}
      </div>
      <input aria-label="Caption" className="w-full border-y border-beige bg-white px-2 py-2 text-base md:text-xs" placeholder="Add a caption" value={caption} maxLength={300} onChange={(event) => setCaption(event.target.value)} onBlur={saveCaption} />
      <div className="flex items-center justify-between">
        {handle}
        <div className="flex">
          <button type="button" title={photo.is_featured ? "Remove from featured" : "Feature"} aria-label={photo.is_featured ? "Remove from featured" : "Feature this photo"} aria-pressed={photo.is_featured} className={ICON_BUTTON} onClick={() => run(() => updatePhoto(photo.id, { is_featured: !photo.is_featured }))}><Star className="size-4" /></button>
          <button type="button" title="Use as hero photo" aria-label="Use as hero photo" className={ICON_BUTTON} onClick={() => run(() => setHeroFromPhoto(photo.id), "Hero photo set. Publish to show guests.")}><Sparkles className="size-4" /></button>
          <button type="button" title={photo.is_visible ? "Hide" : "Show"} aria-label={photo.is_visible ? "Hide photo" : "Show photo"} className={ICON_BUTTON} onClick={() => run(() => updatePhoto(photo.id, { is_visible: !photo.is_visible }))}>{photo.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
          <label title="Replace" className={`${ICON_BUTTON} cursor-pointer`}><RefreshCw className="size-4" /><span className="sr-only">Replace photo</span><input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={replace} /></label>
          <button type="button" title="Remove" aria-label="Remove photo" className={`${ICON_BUTTON} text-[#9a3b2f]`} onClick={remove}><Trash2 className="size-4" /></button>
        </div>
      </div>
    </div>
  );
}

function SlideshowSettings({ controls }: { controls: SiteControls }) {
  const { isBusy, run } = useActionRunner();
  const [seconds, setSeconds] = useState(controls.slideshow_interval_seconds);
  const commitSeconds = () => {
    if (seconds !== controls.slideshow_interval_seconds) void run(() => saveControls({ slideshow_interval_seconds: seconds }), "Timing updated.");
  };

  return (
    <Panel title="Slideshow">
      <Toggle label="Play automatically" checked={controls.slideshow_autoplay} disabled={isBusy} onChange={(value) => run(() => saveControls({ slideshow_autoplay: value }), "Slideshow updated.")} />
      <label className="mt-3 block text-xs font-semibold text-soft-ink">
        Seconds per photo: {seconds}
        <input type="range" min={2} max={30} value={seconds} className="mt-2 block w-full accent-umber" onChange={(event) => setSeconds(Number(event.target.value))} onPointerUp={commitSeconds} onTouchEnd={commitSeconds} onKeyUp={commitSeconds} onBlur={commitSeconds} />
      </label>
    </Panel>
  );
}

function AlbumForm({ album, onClose }: { album: AlbumRow | null; onClose: () => void }) {
  const { confirm } = useFeedback();
  const { isBusy, run } = useActionRunner();
  const [name, setName] = useState(album?.name ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [visibility, setVisibility] = useState<AlbumVisibility>(album?.visibility ?? "public");

  const save = async () => {
    const input = { name, description, visibility };
    const result = album ? await run(() => updateAlbum(album.id, input), "Album saved.") : await run(() => createAlbum(input), "Album created.");
    if (result.ok) onClose();
  };

  const remove = async () => {
    if (!album) return;
    const isConfirmed = await confirm({ title: `Delete "${album.name}"?`, body: "Every photo in this album will be permanently deleted.", confirmLabel: "Delete Album" });
    if (!isConfirmed) return;
    const result = await run(() => deleteAlbum(album.id), "Album deleted.");
    if (result.ok) onClose();
  };

  return (
    <Modal title={album ? "Edit Album" : "New Album"} onClose={onClose}>
      <div className="space-y-4">
        <TextInput label="Album name" value={name} onChange={setName} />
        <TextInput label="Description" multiline value={description} onChange={setDescription} />
        <div>
          <label htmlFor="album-visibility" className="mb-1 block text-xs font-semibold text-soft-ink">Who can see this album</label>
          <select id="album-visibility" className="field" value={visibility} onChange={(event) => setVisibility(event.target.value as AlbumVisibility)}>
            {(Object.keys(VISIBILITY_LABEL) as AlbumVisibility[]).map((option) => <option key={option} value={option}>{VISIBILITY_LABEL[option]}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          {album ? <button type="button" className="btn text-[#9a3b2f]" onClick={remove}>Delete</button> : <span />}
          <button type="button" className="btn btn-solid" onClick={save} disabled={isBusy || !name.trim()}>Save</button>
        </div>
      </div>
    </Modal>
  );
}
