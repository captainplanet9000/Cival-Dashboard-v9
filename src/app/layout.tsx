import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import MinimalErrorBoundary from "@/lib/error-handling/minimal-error-boundary";
import { AGUIProvider } from "@/components/ag-ui/AGUIProvider";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          themes={['light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'high-contrast']}
          disableTransitionOnChange={false}
        >
          <AGUIProvider endpoint="http://localhost:8000/api/v1/agui">
            <MinimalErrorBoundary>
              {children}
            </MinimalErrorBoundary>
          </AGUIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}