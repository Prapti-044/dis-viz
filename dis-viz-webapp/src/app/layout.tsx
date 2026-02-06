import type { Metadata } from "next";
import "../styles/index.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Disassembly Visualization",
  description: "Disassembly visualization tool",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
