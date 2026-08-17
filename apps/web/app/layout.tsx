import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_LOCKUP, APP_NAME } from "@/lib/brand";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans-body",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: APP_LOCKUP,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Your learning platform for AI, cybersecurity, data, blockchain and quantum technology.",
  applicationName: APP_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon.png", sizes: "32x32" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${instrumentSerif.variable} ${manrope.className} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
