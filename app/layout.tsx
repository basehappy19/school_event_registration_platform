import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const promptFont = localFont({
  src: [
    {
      path: "../public/Prompt/Prompt-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/Prompt/Prompt-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบลงทะเบียนเข้าร่วมกิจกรรม",
  description: "ระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
