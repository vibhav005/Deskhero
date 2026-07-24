import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Celebration } from "@/components/app/celebration";

export const metadata: Metadata = {
  title: "DeskHero — Level up your health, one small quest at a time",
  description:
    "A free, gamified wellness prototype for people who sit for long hours. No gym or equipment required.",
};

export const viewport: Viewport = {
  themeColor: "#0d1210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        <StoreProvider>
          {/* Skip link for keyboard + screen-reader users */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          {children}
          <Celebration />
        </StoreProvider>
      </body>
    </html>
  );
}
