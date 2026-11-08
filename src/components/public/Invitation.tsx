import { buildContents, folioFor } from "@/lib/domain/contents";
import type { GalleryAlbum, InvitationData, InvitedGuest } from "@/lib/types";
import { Faq, ThankYou } from "./Closing";
import { ContentsList } from "./ContentsList";
import { EnvelopeGate } from "./EnvelopeGate";
import { Gallery } from "./gallery/Gallery";
import { Guestbook } from "./Guestbook";
import { Hero } from "./Hero";
import { MotionProvider } from "./motion-helpers";
import { Program } from "./Program";
import { Rsvp } from "./Rsvp";
import { MusicToggle, ShareButton, SiteMenu } from "./SiteChrome";
import { About, CountdownSection, DressCode, EventDetails, Welcome } from "./StorySections";
import { Traditions } from "./Traditions";

interface InvitationProps {
  data: InvitationData;
  guest?: InvitedGuest;
  guestAlbums?: GalleryAlbum[];
  isPreview?: boolean;
}

export function Invitation({ data, guest, guestAlbums = [], isPreview = false }: InvitationProps) {
  const { settings, controls, albums, participants, program, wishes } = data;
  const allAlbums = [...albums, ...guestAlbums];
  const showMusic = controls.music_enabled && controls.music_url;
  const contents = buildContents({
    hasTraditions: Object.values(settings.traditions).some((tradition) => tradition.enabled),
    hasProgram: program.length > 0,
    hasFaqs: settings.faqs.length > 0,
  });
  const folio = (id: string) => folioFor(contents, id);

  return (
    <MotionProvider>
      <EnvelopeGate monogram={settings.monogram} celebrantName={settings.celebrant_name} eventTitle={settings.event_title} guestName={guest?.name}>
        <SiteMenu />
        <main>
          <Hero settings={settings} contents={contents} />
          <section className="bg-ivory px-5 pt-14 md:hidden">
            <ContentsList contents={contents} heading="In This Issue" />
          </section>
          <Welcome settings={settings} folio={folio("welcome")} />
          <About settings={settings} folio={folio("about")} />
          <CountdownSection settings={settings} />
          <EventDetails settings={settings} folio={folio("details")} />
          <Gallery folio={folio("gallery")} albums={allAlbums} autoplay={controls.slideshow_autoplay} intervalSeconds={controls.slideshow_interval_seconds} />
          <Traditions folio={folio("traditions")} config={settings.traditions} participants={participants} />
          <Program folio={folio("program")} items={program} />
          <DressCode settings={settings} folio={folio("dress-code")} />
          <Rsvp folio={folio("rsvp")} celebrantName={settings.celebrant_name} isOpen={controls.rsvp_open} guest={guest} isPreview={isPreview} />
          <Guestbook folio={folio("wishes")} wishes={wishes} isOpen={controls.guestbook_open} isPreview={isPreview} guestName={guest?.name} />
          <Faq folio={folio("faq")} faqs={settings.faqs} />
        </main>
        <ThankYou settings={settings} guestCode={guest?.code} showPhotoUpload={controls.guest_uploads_enabled} />
        <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
          {showMusic && <MusicToggle src={controls.music_url as string} title={controls.music_title} />}
          <ShareButton title={`${settings.celebrant_name}: ${settings.event_title}`} />
        </div>
      </EnvelopeGate>
    </MotionProvider>
  );
}

export function NotReadyNotice() {
  return (
    <main className="linen flex min-h-svh items-center justify-center px-6 text-center">
      <div>
        <p className="font-script text-5xl">Coming Soon</p>
        <p className="mt-4 text-soft-ink">This invitation is still being prepared. Please check back shortly.</p>
      </div>
    </main>
  );
}
