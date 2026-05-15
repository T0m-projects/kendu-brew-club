import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KENDU Brew Club",
  description:
    "A read-only community tool for KENDU holders. Track public wallet balances, preview holder status and build toward future DCA streaks.",
  openGraph: {
    title: "KENDU Brew Club",
    description:
      "Track KENDU balances, holder status and future DCA streaks. Read-only. No wallet approvals. No transactions.",
    type: "website",
    siteName: "KENDU Brew Club",
  },
  twitter: {
    card: "summary_large_image",
    title: "KENDU Brew Club",
    description:
      "A read-only community tool for KENDU holders. No wallet approvals. No transactions.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
