import type { Metadata } from "next";

import { Inter } from "next/font/google";

import { LiveAvatarProvider } from "@/components/logic";

import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant LiveAvatar",
  description: "Restaurant agent with a LiveAvatar front-of-house experience.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LiveAvatarProvider>{children}</LiveAvatarProvider>
      </body>
    </html>
  );
}
