import type { Metadata } from "next";
import { Oxanium, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import GlobalErrorBoundary from "@/components/error-boundaries/GlobalErrorBoundary";
import { AGUIProvider } from "@/components/ag-ui/fallback";
import { WebSocketProvider } from "@/contexts/websocket-context";
import MigrationInitializer from "@/components/database/MigrationInitializer";

const oxanium = Oxanium({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-mono',
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
      <body className={`${oxanium.variable} ${sourceCodePro.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          themes={['light', 'dark', 'trading-green', 'trading-blue', 'trading-modern', 'brutalist']}
          disableTransitionOnChange={false}
        >
          <WebSocketProvider>
            <AGUIProvider>
              <MigrationInitializer>
                <GlobalErrorBoundary>
                  {children}
                </GlobalErrorBoundary>
              </MigrationInitializer>
            </AGUIProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}