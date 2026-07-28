import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Celebration } from "@/components/app/celebration";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeskHero — Level up your health, one small quest at a time",
  description:
    "A free, gamified wellness prototype for people who sit for long hours. No gym or equipment required.",
};

export const viewport: Viewport = {
  // Matches --background's dark HSL value (28 14% 6%) from globals.css. Static
  // metadata can't read CSS vars, so update this by hand if that value changes.
  themeColor: "#110f0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable, fraunces.variable)}>
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
