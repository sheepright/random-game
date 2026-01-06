import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const paperlogy = localFont({
  src: "../public/Fonts/Paperlogy-6SemiBold.ttf",
  variable: "--font-paperlogy",
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  title: "용사키우기 - Hero Training Game",
  description: "장비를 강화하고 스테이지를 클리어하는 용사 육성 게임",
  keywords: ["게임", "용사키우기", "RPG", "육성게임", "웹게임"],
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${paperlogy.variable} antialiased`}
        style={{
          fontFamily:
            'var(--font-paperlogy), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
