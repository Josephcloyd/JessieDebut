import { Camera, Download, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { EventSettings, Faq as FaqEntry } from "@/lib/types";
import { Reveal } from "./motion-helpers";
import { SectionHeading } from "./SectionHeading";

export function Faq({ faqs, folio }: { faqs: FaqEntry[]; folio: string }) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="bg-beige px-5 py-20 md:py-28">
      <SectionHeading folio={folio} title="Questions" />
      <div className="mx-auto max-w-6xl divide-y divide-umber/20 border-y border-umber/20">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl md:text-3xl">
              {faq.question}
              <span className="text-dusk transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 max-w-2xl whitespace-pre-line leading-relaxed text-soft-ink">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

interface ThankYouProps {
  settings: EventSettings;
  guestCode?: string;
  showPhotoUpload: boolean;
}

/** The back cover. */
export function ThankYou({ settings, guestCode, showPhotoUpload }: ThankYouProps) {
  const cardHref = guestCode ? `/card?code=${guestCode}` : "/card";

  return (
    <footer id="thank-you" className="bg-fern px-5 py-24 text-ivory md:py-36">
      <Reveal className="mx-auto max-w-6xl">
        <p className="font-script text-7xl leading-none md:text-9xl">{settings.thank_you_heading}</p>
        <p className="mt-8 max-w-2xl whitespace-pre-line font-display text-3xl leading-snug text-beige">{settings.thank_you_message}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href={cardHref} download className="btn btn-light"><Download className="size-4" strokeWidth={1.5} /> Save the Invitation Card</a>
          {showPhotoUpload && <Link href="/upload" className="btn btn-light"><Camera className="size-4" strokeWidth={1.5} /> Share Your Photos</Link>}
          {settings.contact_phone && <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`} className="btn btn-light"><Phone className="size-4" strokeWidth={1.5} /> Call the Organizer</a>}
          {settings.contact_email && <a href={`mailto:${settings.contact_email}`} className="btn btn-light"><Mail className="size-4" strokeWidth={1.5} /> Email the Organizer</a>}
        </div>
        {settings.contact_name && <p className="eyebrow mt-8 text-[0.6rem] text-beige">Organizer: {settings.contact_name}</p>}
      </Reveal>
    </footer>
  );
}
