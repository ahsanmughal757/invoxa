import type { Metadata } from "next";
import { FileText, CreditCard, Receipt, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in — Invoxa",
  description: "Sign in to Invoxa to manage your invoicing workflow.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Invoxa</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Professional invoicing
            <br />
            for modern teams.
          </h1>
          <p className="text-blue-100/90 max-w-md">
            Send invoices, record payments, and understand your cash flow — all
            in one place.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              { icon: CreditCard, text: "Track money in and money out" },
              { icon: Receipt, text: "Professional, branded invoices" },
              { icon: BarChart3, text: "Clear financial insights" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-200/70">
          © {new Date().getFullYear()} Invoxa. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center bg-muted/40 p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Invoxa
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}