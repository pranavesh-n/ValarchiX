import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import InstallPwaModal from "@/components/InstallPwaModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ValarchiX | Financial Knowledge OS",
  description: "Learn. Analyze. Invest Smarter. Understand businesses, mutual funds, taxes, retirement, and personal finance through data-driven education.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ValarchiX",
  },
};

export const viewport: Viewport = {
  themeColor: "#081c3a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-navy-bg text-light-grey" suppressHydrationWarning>
        <Navigation />
        <div className="flex-1 md:pl-64 flex flex-col min-w-0 w-full overflow-x-hidden">
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 pb-28 md:pb-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
            {children}
          </main>
          
          {/* Universal Footer Disclaimer — hidden on mobile (bottom nav bar is there) */}
          <footer className="hidden md:block border-t border-border-navy bg-footer-bg py-8 px-4 md:px-8 text-center text-xs text-muted-grey mt-auto">
            <div className="max-w-4xl mx-auto space-y-3">
              <p className="font-semibold text-emerald">
                💡 &ldquo;We don&apos;t tell what to pick, we tell how to pick&rdquo;
              </p>
              <p className="leading-relaxed">
                ValarchiX is an educational simulator for building financial knowledge. Calculators, planning models, and metrics are designed to teach analytical thinking. We do not provide SEBI-registered investment, legal, or tax advice. Read our full <a href="/disclaimer" className="text-emerald hover:underline font-semibold">Disclaimer &amp; Legal Disclosures</a> before using the platform.
              </p>
              <p>© {new Date().getFullYear()} ValarchiX. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
