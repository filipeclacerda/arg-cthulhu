import { UnlockCondition } from "./filesystem";

export interface VEmail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  body: string;
  unlock: UnlockCondition;
}

export const emails: VEmail[] = [
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
    id: "email-2",
    sender: "orders@graymoor-antiquarian.com",
    subject: "Your order has shipped — Lot 114",
    date: "2026-02-28",
    unlock: { type: "always" },
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
];
