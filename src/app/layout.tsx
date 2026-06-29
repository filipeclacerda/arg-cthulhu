import "./globals.scss";
import type { Metadata } from "next";
import { WindowManagerProvider } from "./context/WindowManagerContext";
import { ProgressProvider } from "./context/ProgressContext";
import { ZoomProvider } from "./context/ZoomContext";
import { WindowLayer } from "./components/WindowFrame/WindowFrame";

export const metadata: Metadata = {
  title: "O Arquivo de Amanhã",
  description: "Recovered disk image — Sarah Bishop workstation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" id="root">
      <body>
        <ZoomProvider>
          <ProgressProvider>
            <WindowManagerProvider>
              {children}
              <WindowLayer />
            </WindowManagerProvider>
          </ProgressProvider>
        </ZoomProvider>
      </body>
    </html>
  );
}
