import React from "react";
import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./styles/site.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Invoxa - Simplify Your Invoicing Process",
  description:
    "Experience seamless invoice management that saves you time and boosts your cash flow. Start your free trial today.",
  generator: "v0.app",
};

const SiteLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* <body className="font-sans antialiased">{children}</body> */}
        <body className={`${spaceGrotesk.variable} ${inter.variable} dark`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
};

export default SiteLayout;
