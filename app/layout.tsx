import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "네일아트 AI 학습 도우미",
  description:
    "입체 네일아트 × 경우의 수 융합수업용 AI 학습 도우미 — 광신방송예술고 미디어메이크업과",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${noto.variable} antialiased`}>{children}</body>
    </html>
  );
}
