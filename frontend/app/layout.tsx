import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VEIL — Privacy-First AI Knowledge Workspace",
  description:
    "Interact with your local knowledge through natural language using Moss sub-10ms semantic retrieval and on-device intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#000000] text-[#F5F9FC] min-h-screen antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
