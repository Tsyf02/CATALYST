import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Notes, calendar, reminders for events, work, and contests",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen pb-24">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
