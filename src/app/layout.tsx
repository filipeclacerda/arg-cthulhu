import "./globals.scss";
import type { Metadata } from "next";
import { WindowManagerProvider } from "./context/WindowManagerContext";
import { ProgressProvider } from "./context/ProgressContext";
import { ZoomProvider } from "./context/ZoomContext";
import { SoundProvider } from "./context/SoundContext";
import { ComfortProvider } from "./context/ComfortContext";
import { WindowLayer } from "./components/WindowFrame/WindowFrame";
import NavigationGuard from "./components/NavigationGuard/NavigationGuard";
import SystemContextMenu from "./components/SystemContextMenu/SystemContextMenu";
import SystemToast from "./components/SystemToast/SystemToast";
import { PHProvider } from "./components/PHProvider/PHProvider";
import DevToolsGate from "./components/DevTools/DevToolsGate";
import LocaleDocumentSync from "./components/LocaleDocumentSync/LocaleDocumentSync";

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
          <ComfortProvider>
          <SoundProvider>
            <ProgressProvider>
              <WindowManagerProvider>
                <LocaleDocumentSync />
                <NavigationGuard />
                <SystemToast />
                <SystemContextMenu />
                {children}
                <WindowLayer />
                <DevToolsGate />
              </WindowManagerProvider>
            </ProgressProvider>
          </SoundProvider>
          </ComfortProvider>
        </ZoomProvider>
        </PHProvider>
      </body>
    </html>
  );
}
