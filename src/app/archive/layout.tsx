import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Fourth Recipient — uma investigação no navegador",
  description:
    "Explore um computador recuperado, conecte evidências e reconstrua um caso que não deveria ter um quarto destinatário.",
  alternates: {
    canonical: "/archive",
  },
};

export default function ArchiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
