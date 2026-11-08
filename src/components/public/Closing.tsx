import { Camera, Download, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { EventSettings, Faq as FaqEntry } from "@/lib/types";
import { Reveal } from "./motion-helpers";
import { SakuraBranch } from "./sakura";

export function Faq({ faqs }: { faqs: FaqEntry[] }) {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="px-6 pb-20 md:pb-32">
      <div className="mx-auto grid max-w-6xl gap-6 border-t border-umber/20 pt-10 md:grid-cols-[2fr_3fr] md:gap-20 md:pt-14">
        <h2 className="font-display text-5xl font-light leading-none md:text-6xl">Questions</h2>
        <div className="divide-y divide-umber/15">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4 first:pt-0">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl transition-colors hover:text-soft-ink md:text-3xl">
                {faq.question}
                <span className="numerals text-2xl transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl whitespace-pre-line leading-relaxed text-soft-ink">{faq.answer}</p>
            </details>
          ))}
        </div>
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
    <footer id="thank-you" className="relative overflow-hidden bg-umber px-6 pb-40 pt-24 text-center text-ivory md:pb-44 md:pt-36">
      <SakuraBranch petals="cream" isOnDark className="absolute bottom-0 right-0 w-44 rotate-180 md:w-[30rem]" />
      <SakuraBranch petals="cream" isOnDark className="absolute left-0 top-0 hidden w-72 md:block" />
      <Reveal className="relative mx-auto max-w-3xl">
        <p className="font-script text-8xl leading-none text-gold md:text-[10rem]">{settings.thank_you_heading}</p>
        <p className="mt-8 whitespace-pre-line text-balance font-display text-3xl font-light leading-snug md:text-4xl">{settings.thank_you_message}</p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <a href={cardHref} download className="btn btn-light"><Download className="size-4" strokeWidth={1.5} /> Save the Invitation Card</a>
          {showPhotoUpload && <Link href="/upload" className="btn btn-light"><Camera className="size-4" strokeWidth={1.5} /> Share Your Photos</Link>}
          {settings.contact_phone && <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`} className="btn btn-light"><Phone className="size-4" strokeWidth={1.5} /> Call the Organizer</a>}
          {settings.contact_email && <a href={`mailto:${settings.contact_email}`} className="btn btn-light"><Mail className="size-4" strokeWidth={1.5} /> Email the Organizer</a>}
        </div>
        {settings.contact_name && <p className="mt-8 font-display text-lg italic text-beige">Organizer: {settings.contact_name}</p>}
      </Reveal>
    </footer>
  );
}
