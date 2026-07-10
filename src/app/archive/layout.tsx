import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Archive of Tomorrow — uma investigação no navegador",
  description:
    "Explore um computador recuperado, conecte evidências e reconstrua um caso que não deveria existir.",
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
