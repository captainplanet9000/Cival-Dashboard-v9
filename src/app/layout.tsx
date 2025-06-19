import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/lib/error-handling/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Cival Dashboard - Algorithmic Trading Platform",
  description: "Advanced algorithmic trading dashboard with AI-powered strategies, real-time analytics, and comprehensive risk management",
  keywords: ["algorithmic trading", "trading dashboard", "AI trading", "financial analytics", "risk management"],
  authors: [{ name: "Cival Trading Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // Private trading platform
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          themes={["light", "dark", "system"]}
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <div id="root" className="min-h-screen">
              {children}
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
