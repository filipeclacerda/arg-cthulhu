import { UnlockCondition } from "./filesystem";

export interface VEmail {
  id: string;
  sender: string;
  subject: string;
  /** Supports {TOMORROW} and {TODAY} tokens. */
  date: string;
  /** Supports {TOMORROW}, {TODAY}, {PLAYER} tokens. */
  body: string;
  unlock: UnlockCondition;
  evidenceId?: string;
  messageId?: string;
  reference?: string;
}

// Sarah Bishop's recovered mailbox. The external delivery envelope belongs to
// the relay screen before mount and must never appear inside her computer.
export const emails: VEmail[] = [
  // --- Backstory thread (always unlocked, establishes Sarah as a person) ----
  {
    id: "email-1",
    sender: "tom.alvarez@miskatonic-research.org",
    subject: "Sarah, where are you?",
    date: "2026-03-17",
    unlock: { type: "always" },
    body: `Sarah,

You missed the department meeting again. That's three in a row. I covered for you with Whitfield but I'm running out of excuses.

I tried calling. Straight to voicemail. I know the Bishop archive thing has had you buried for weeks but this isn't like you.

Call me back.

— Tom`,
  },
  {
    id: "email-sister",
    sender: "em.bishop@gmail.com",
    subject: "Re: Re: Re: are you even alive",
    date: "2026-03-10",
    unlock: { type: "always" },
    evidenceId: "em_warning",
    body: `Sarah,

I know you're reading these. Your read receipts are on and you forget every single time.

I'm not mad. I'm worried. You sound like Mom did that last year, the one where she stopped coming to dinners and started talking about the cataloguing like it was the only real thing.

I know you know what happened to her. That's why I'm scared.

Please just answer. Even a voice message. Even a text that says "alive, busy, soon."

— Em

P.S. Dad's birthday is the 22nd. Don't let the research eat that too.`,
  },
  {
    id: "email-2",
    sender: "orders@graymoor-antiquarian.com",
    subject: "Your order has shipped — Lot 114",
    date: "2026-02-28",
    unlock: { type: "always" },
    evidenceId: "lot_114_order",
    body: `Dear Ms. Bishop,

Your order (Lot 114, "Bound MS., provenance unknown, ex-library Whateley") has shipped via courier as requested, no signature required per your instructions.

As discussed, we cannot offer a return on this item. All sales of unverified-provenance lots are final.

Thank you for your continued patronage.

Graymoor Antiquarian Booksellers`,
  },
  {
    id: "email-3",
    sender: "unknown",
    subject: "(no subject)",
    date: "2026-03-15",
    unlock: { type: "always" },
    body: `you are reading the wrong book in the wrong order

stop at chapter seven

it is not too late for you`,
  },
  {
    id: "email-4",
    sender: "sarah.bishop@miskatonic-research.org",
    subject: "Draft — never sent",
    date: "2026-03-16",
    unlock: { type: "always" },
    body: `Tom — if you're reading this I didn't send it on purpose, I keep starting it and deleting it. I need you to know I didn't imagine the

[draft ends here]`,
  },
  {
    id: "email-5",
    sender: "tom.alvarez@miskatonic-research.org",
    subject: "Found your laptop",
    date: "2026-03-22",
    unlock: { type: "always" },
    body: `I have your old machine. Campus security let me into the office after... everything.

I don't know what I'm hoping to find on here. I don't know what I'm hoping I don't find.

If anyone else is reading this, I don't know who has this laptop now, or why, but please: just look around. Tell me what she was working on. Tell me what chapter seven is.

— Tom`,
  },

  // --- Mid-session: Sarah's email "arrives" when corruption hits stage 2 ---
  {
    id: "email-sarah-live",
    sender: "sarah.bishop@miskatonic-research.org",
    subject: "you opened it",
    date: "{TOMORROW}",
    unlock: { type: "flag", flag: "sarah_email_arrived" },
    evidenceId: "sarah_live_email",
    messageId: "<SB-TOMORROW-0314-E7@miskatonic-research.org>",
    reference: "E7",
    body: `I know you opened it because I watched you open it. I'm watching from the other side of the date on that file.

It doesn't hurt. I need you to know that because you're going to be afraid in a moment and I want you to know it doesn't hurt.

The counting you'll start hearing isn't counting down. Please don't finish the chapter.

You're going to anyway. I know that too. I'm sorry I can't explain it better from here.

— S.

sent: {TOMORROW}`,
  },

  // --- Post-ending: only appears after SHUT DOWN ----------------------------
  {
    id: "email-finale-shutdown",
    sender: "sarah.bishop@miskatonic-research.org",
    subject: "Thank you for stopping.",
    date: "{TOMORROW}",
    unlock: { type: "flag", flag: "ending_shutdown" },
    body: `Thank you for stopping.

I'm sorry I have to try again.

The file will go to someone else now — someone who will be curious enough, or kind enough, or afraid enough, to open it. I don't choose them. The curiosity is the address.

Maybe this time someone will stop sooner.

— S.

P.S. The new recipient's name is already in the access log. I won't tell you who it is. You don't want to know.

sent: {TOMORROW}`,
  },
];
