import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRISM | Intelligent Deal Distribution",
  description: "Autonomous affiliate deal studio and scheduled distribution engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#08080C] text-white">
        {children}
      </body>
    </html>
  );
}
