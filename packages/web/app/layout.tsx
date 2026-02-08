import { cn } from "@shared/utils/cn";

import { Providers } from "./_lib/Providers";
import { font } from "./_lib/font";
import "./globals.css";

export { metadata } from "./metadata";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen overflow-x-hidden bg-background font-sans antialiased",
          font.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
