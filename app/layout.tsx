import "./globals.css";
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"], weight: ["300", "500", "700"] });
const lexend = Lexend({ subsets: ["latin"], weight: ["300", "500", "700"] });

export const metadata: Metadata = {
  title: "Invoxa - Invoicing Solutions",
  description:
    "Complete invoice management solution with templates, payments tracking, and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={lexend.className}>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
