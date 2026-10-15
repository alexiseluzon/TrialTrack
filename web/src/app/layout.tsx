import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "TrialTrack", template: "%s | TrialTrack" },
  description: "Demo clinical trial registry. Fake data only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-sky-50 antialiased dark:from-slate-950 dark:to-slate-900`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <TooltipProvider>
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
        </TooltipProvider>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          © 2026 Alexis E. Luzon. Demo only, fake data. Provided as is without warranty; the author is not liable for any use of this software.
        </footer>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
