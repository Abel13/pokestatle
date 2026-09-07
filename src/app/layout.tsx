import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PokéStatle — Daily Pokémon Guessing",
  description:
    "Guess the daily Pokémon using type, generation, height, weight, and base stats feedback.",
  applicationName: "PokéStatle",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "PokéStatle — Daily Pokémon Guessing",
    description:
      "Guess the daily Pokémon using type, generation, height, weight, and base stats feedback.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "PokéStatle" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} h-full`}>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-dvh flex-col">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.10),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08),_transparent_45%)]" />
            <SiteHeader />
            <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-5 sm:max-w-5xl sm:px-4 sm:py-8">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
