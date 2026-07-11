import "./globals.scss";
import type { Metadata } from "next";
import { WindowManagerProvider } from "./context/WindowManagerContext";
import { ProgressProvider } from "./context/ProgressContext";
import { ZoomProvider } from "./context/ZoomContext";
import { SoundProvider } from "./context/SoundContext";
import { WindowLayer } from "./components/WindowFrame/WindowFrame";
import NavigationGuard from "./components/NavigationGuard/NavigationGuard";
import SystemContextMenu from "./components/SystemContextMenu/SystemContextMenu";
import SystemToast from "./components/SystemToast/SystemToast";
import { PHProvider } from "./components/PHProvider/PHProvider";

export const metadata: Metadata = {
  title: "The Archive Remembers Tomorrow",
  description:
    "A forensic disk image, an unresolved delivery table, and a missing researcher.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" id="root">
      <body>
        <PHProvider>
        <ZoomProvider>
          <SoundProvider>
            <ProgressProvider>
              <WindowManagerProvider>
                <NavigationGuard />
                <SystemToast />
                <SystemContextMenu />
                {children}
                <WindowLayer />
              </WindowManagerProvider>
            </ProgressProvider>
          </SoundProvider>
        </ZoomProvider>
        </PHProvider>
      </body>
    </html>
  );
}
