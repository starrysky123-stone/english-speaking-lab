import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Speaking Lab｜開口練習室",
  description: "從日常聊天到學術交流，每天一點練習，自信說出你的想法。單字、跟讀、情境對話與個人複習。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
