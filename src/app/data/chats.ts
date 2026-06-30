import { UnlockCondition } from "./filesystem";

export type MessengerPresence = "online" | "away" | "busy" | "offline";
export type MessengerThreadMode = "readonly" | "choices" | "freeform";

export interface ChatParticipant {
  id: string;
  displayName: string;
  address: string;
  presence: MessengerPresence;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  timestamp: string;
  body: string;
  kind?: "message" | "system";
}

export interface SuggestedReply {
  id: string;
  label: string;
  body: string;
}

export interface ChatThread {
  id: string;
  title: string;
  contactId: string;
  mode: MessengerThreadMode;
  unlock: UnlockCondition;
  evidenceId: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  suggestedReplies?: SuggestedReply[];
}

export const chats: ChatThread[] = [
  {
    id: "chat-tom",
    title: "Tom Alvarez",
    contactId: "tom",
    mode: "readonly",
    unlock: { type: "always" },
    evidenceId: "chat_tom_archive",
    participants: [
      {
        id: "sarah",
        displayName: "Sarah Bishop",
        address: "sarah.bishop@miskatonic-research.org",
        presence: "away",
      },
      {
        id: "tom",
        displayName: "Tom Alvarez",
        address: "tom.alvarez@miskatonic-research.org",
        presence: "offline",
      },
    ],
    messages: [
      {
        id: "tom-1",
        senderId: "sarah",
        timestamp: "03/02/2026 09:18 PM",
        body: "It arrived. The bookseller called it “unverified provenance.” It's Volume II, Tom. Mom's missing volume.",
      },
      {
        id: "tom-2",
        senderId: "tom",
        timestamp: "03/02/2026 09:21 PM",
        body: "That sentence contains at least four reasons to put it back in the box.",
      },
      {
        id: "tom-3",
        senderId: "sarah",
        timestamp: "03/02/2026 09:22 PM",
        body: "Five. The binding is still damp.",
      },
      {
        id: "tom-4",
        senderId: "tom",
        timestamp: "03/02/2026 09:24 PM",
        body: "Lunch tomorrow. No archive, no Whateleys, no dead languages. I am putting this in writing.",
      },
      {
        id: "tom-5",
        senderId: "sarah",
        timestamp: "03/02/2026 09:25 PM",
        body: "Fine. If I say the name Bellaso, confiscate my coffee and make me sleep.",
      },
      {
        id: "tom-6",
        senderId: "sarah",
        timestamp: "03/14/2026 03:06 AM",
        body: "Hypothetical question. Can a message have a read receipt before it has been sent?",
      },
      {
        id: "tom-7",
        senderId: "tom",
        timestamp: "03/14/2026 03:08 AM",
        body: "That is not hypothetical enough. Go home, Sarah.",
      },
      {
        id: "tom-8",
        senderId: "tom",
        timestamp: "03/16/2026 11:43 PM",
        body: "Your status keeps changing to Online for one second. Are you there?",
      },
      {
        id: "tom-9",
        senderId: "tom",
        timestamp: "03/17/2026 12:11 AM",
        body: "Sarah?",
      },
    ],
  },
  {
    id: "chat-em",
    title: "Em Bishop",
    contactId: "em",
    mode: "readonly",
    unlock: { type: "always" },
    evidenceId: "chat_em_archive",
    participants: [
      {
        id: "sarah",
        displayName: "Sarah Bishop",
        address: "sarah.bishop@miskatonic-research.org",
        presence: "away",
      },
      {
        id: "em",
        displayName: "Em Bishop",
        address: "em.bishop@example.com",
        presence: "offline",
      },
    ],
    messages: [
      {
        id: "em-1",
        senderId: "em",
        timestamp: "11/02/2025 06:40 PM",
        body: "Sending the coast photo. You look like I forced you to hold the notebook at gunpoint.",
      },
      {
        id: "em-2",
        senderId: "sarah",
        timestamp: "11/02/2025 06:42 PM",
        body: "You said we were going for lunch. You drove us to Innsmouth.",
      },
      {
        id: "em-3",
        senderId: "em",
        timestamp: "11/02/2025 06:43 PM",
        body: "Zoom in behind us. What is the tall thing in the water?",
      },
      {
        id: "em-4",
        senderId: "sarah",
        timestamp: "11/02/2025 06:45 PM",
        body: "A piling. Please let one object in Massachusetts be just an object.",
      },
      {
        id: "em-5",
        senderId: "em",
        timestamp: "03/10/2026 08:12 PM",
        body: "Dad moved dinner to Sunday because he thinks that gives you a better chance of remembering it.",
      },
      {
        id: "em-6",
        senderId: "sarah",
        timestamp: "03/10/2026 08:14 PM",
        body: "I remembered last year.",
      },
      {
        id: "em-7",
        senderId: "em",
        timestamp: "03/10/2026 08:15 PM",
        body: "Last year you arrived after the cake had become breakfast.",
      },
      {
        id: "em-8",
        senderId: "sarah",
        timestamp: "03/15/2026 02:51 AM",
        body: "Do you remember Mom counting in her office? Not numbers exactly. Names, maybe.",
      },
      {
        id: "em-9",
        senderId: "em",
        timestamp: "03/15/2026 07:04 AM",
        body: "I remember you asking me that when you were seven. Call me when you wake up.",
      },
    ],
  },
  {
    id: "chat-library",
    title: "Special Collections Staff",
    contactId: "staff",
    mode: "readonly",
    unlock: { type: "always" },
    evidenceId: "chat_library_archive",
    participants: [
      {
        id: "sarah",
        displayName: "Sarah Bishop",
        address: "sarah.bishop@miskatonic-research.org",
        presence: "away",
      },
      {
        id: "staff",
        displayName: "Special Collections Staff",
        address: "orne-special-collections",
        presence: "offline",
      },
    ],
    messages: [
      {
        id: "staff-1",
        senderId: "staff",
        timestamp: "03/02/2026 10:04 AM",
        body: "SYSTEM: Sarah Bishop added temporary accession MS-WHA-114. Record is pending provenance review.",
        kind: "system",
      },
      {
        id: "staff-2",
        senderId: "staff",
        timestamp: "03/09/2026 04:32 PM",
        body: "Whitfield: Whoever keeps returning the dehumidifier to B2, stop. B2 is reading 91% humidity with the unit running.",
      },
      {
        id: "staff-3",
        senderId: "sarah",
        timestamp: "03/09/2026 04:35 PM",
        body: "The sensor is wrong. The boxes are dry.",
      },
      {
        id: "staff-4",
        senderId: "staff",
        timestamp: "03/09/2026 04:36 PM",
        body: "Whitfield: The floor is not.",
      },
      {
        id: "staff-5",
        senderId: "staff",
        timestamp: "03/16/2026 03:14 AM",
        body: "SYSTEM: Legacy account M.BISHOP authenticated from workstation SB-ARCHIVE-02.",
        kind: "system",
      },
      {
        id: "staff-6",
        senderId: "staff",
        timestamp: "03/16/2026 03:15 AM",
        body: "SYSTEM: Message could not be delivered. M.BISHOP account was closed in 1998.",
        kind: "system",
      },
    ],
  },
];

