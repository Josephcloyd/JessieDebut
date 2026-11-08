"use client";

import { Plus, Trash2 } from "lucide-react";
import { isoToManilaInput, manilaInputToIso } from "@/lib/domain/time";
import type { EventSettings } from "@/lib/types";
import { ImageField, PageTitle, Panel, TextInput } from "./fields";
import { useDraftForm } from "./useDraftForm";

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function EventEditor({ settings }: { settings: EventSettings }) {
  const { values, set, bind, save, isBusy } = useDraftForm({
    celebrant_name: settings.celebrant_name,
    monogram: settings.monogram,
    event_title: settings.event_title,
    event_at: settings.event_at,
    venue_name: settings.venue_name,
    venue_address: settings.venue_address,
    maps_url: settings.maps_url,
    reception_info: settings.reception_info,
    dress_code: settings.dress_code,
    dress_code_notes: settings.dress_code_notes,
    special_instructions: settings.special_instructions,
    welcome_heading: settings.welcome_heading,
    welcome_message: settings.welcome_message,
    about_title: settings.about_title,
    about_bio: settings.about_bio,
    about_message: settings.about_message,
    about_image_url: settings.about_image_url,
    invitation_hosts: settings.invitation_hosts,
    invitation_request: settings.invitation_request,
    contact_name: settings.contact_name,
    contact_phone: settings.contact_phone,
    contact_email: settings.contact_email,
    thank_you_heading: settings.thank_you_heading,
    thank_you_message: settings.thank_you_message,
    faqs: settings.faqs,
  });

  const setEventTime = (local: string) => {
    if (LOCAL_DATE_TIME.test(local)) set("event_at", manilaInputToIso(local));
  };
  const updateFaq = (index: number, key: "question" | "answer", value: string) =>
    set("faqs", values.faqs.map((faq, position) => (position === index ? { ...faq, [key]: value } : faq)));

  return (
    <>
      <PageTitle
        title="Event Information"
        description="Saved edits stay private until you publish them."
        actions={<button type="button" className="btn btn-solid" onClick={save} disabled={isBusy}>{isBusy ? "Saving" : "Save Changes"}</button>}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="The celebration">
          <div className="space-y-4">
            <TextInput label="Celebrant name" {...bind("celebrant_name")} />
            <TextInput label="Monogram initials" {...bind("monogram")} hint="Up to 3 letters. Used on the seal and favicon." />
            <TextInput label="Event title" {...bind("event_title")} />
            <TextInput label="Hosts on the invitation" {...bind("invitation_hosts")} placeholder="Mr. and Mrs. ..." />
            <TextInput label="Invitation wording" multiline {...bind("invitation_request")} />
            <TextInput label="Date and time (Philippine time)" type="datetime-local" value={isoToManilaInput(values.event_at)} onChange={setEventTime} />
          </div>
        </Panel>
        <Panel title="Venue">
          <div className="space-y-4">
            <TextInput label="Venue name" {...bind("venue_name")} />
            <TextInput label="Complete address" multiline {...bind("venue_address")} />
            <TextInput label="Google Maps link" {...bind("maps_url")} placeholder="https://maps.app.goo.gl/..." />
            <TextInput label="Reception information" multiline {...bind("reception_info")} />
          </div>
        </Panel>
        <Panel title="Dress code and instructions">
          <div className="space-y-4">
            <TextInput label="Dress code" {...bind("dress_code")} />
            <TextInput label="Dress code notes" multiline {...bind("dress_code_notes")} />
            <TextInput label="Special instructions" multiline {...bind("special_instructions")} />
          </div>
        </Panel>
        <Panel title="Welcome message">
          <div className="space-y-4">
            <TextInput label="Heading" {...bind("welcome_heading")} />
            <TextInput label="Message" multiline {...bind("welcome_message")} />
          </div>
        </Panel>
        <Panel title="About the debutant">
          <div className="space-y-4">
            <ImageField label="Portrait" value={values.about_image_url} folder="about" onChange={(url) => set("about_image_url", url)} />
            <TextInput label="Section title" {...bind("about_title")} />
            <TextInput label="Biography" multiline {...bind("about_bio")} />
            <TextInput label="Heartfelt message" multiline {...bind("about_message")} />
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel title="Organizer contact">
            <div className="space-y-4">
              <TextInput label="Name" {...bind("contact_name")} />
              <TextInput label="Phone" type="tel" {...bind("contact_phone")} />
              <TextInput label="Email" type="email" {...bind("contact_email")} />
            </div>
          </Panel>
          <Panel title="Thank-you section">
            <div className="space-y-4">
              <TextInput label="Heading" {...bind("thank_you_heading")} />
              <TextInput label="Message" multiline {...bind("thank_you_message")} />
            </div>
          </Panel>
        </div>
      </div>
      <div className="mt-5">
        <Panel title="Frequently asked questions">
          <div className="space-y-5">
            {values.faqs.map((faq, index) => (
              <div key={index} className="grid gap-3 border-b border-beige pb-5 md:grid-cols-[1fr_1fr_auto]">
                <TextInput label="Question" value={faq.question} onChange={(value) => updateFaq(index, "question", value)} />
                <TextInput label="Answer" value={faq.answer} onChange={(value) => updateFaq(index, "answer", value)} />
                <button type="button" aria-label={`Remove question ${index + 1}`} className="flex size-11 items-center justify-center self-end text-[#9a3b2f]" onClick={() => set("faqs", values.faqs.filter((_, position) => position !== index))}><Trash2 className="size-4" /></button>
              </div>
            ))}
            <button type="button" className="btn btn-line" onClick={() => set("faqs", [...values.faqs, { question: "", answer: "" }])}><Plus className="size-4" /> Add Question</button>
          </div>
        </Panel>
      </div>
    </>
  );
}
