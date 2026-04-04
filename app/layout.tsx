import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "开源趋势情报台",
  description: "开源趋势情报台：面向开发者、分析师与内容团队的 GitHub 周榜、专题榜、历史归档与 AI 接入工作台。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
