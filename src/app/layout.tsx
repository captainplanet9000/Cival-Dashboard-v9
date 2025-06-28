import type { Metadata } from "next";
import "./globals-minimal.css";
import MinimalErrorBoundary from "@/lib/error-handling/minimal-error-boundary";

export const metadata: Metadata = {
  title: "Cival Dashboard - Trading Platform",
  description: "Trading dashboard",
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <MinimalErrorBoundary>
          {children}
        </MinimalErrorBoundary>
      </body>
    </html>
  );
}