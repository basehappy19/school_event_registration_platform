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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tutor.phukhieo.ac.th/"),
  title: {
    template: "%s | ระบบลงทะเบียน",
    default: "ระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
  },
  description: "ระบบลงทะเบียนเข้าร่วมกิจกรรมต่างๆ ของโรงเรียนภูเขียว สะดวก รวดเร็ว ตรวจสอบสถานะและพิมพ์ประกาศรายชื่อได้ทันที",
  keywords: [
    "ลงทะเบียน", 
    "กิจกรรม", 
    "โรงเรียนภูเขียว", 
    "ระบบลงทะเบียนกิจกรรม", 
    "กิจกรรมโรงเรียน", 
    "Phukhieo", 
    "Phukhieo School"
  ],
  authors: [{ name: "โรงเรียนภูเขียว" }],
  creator: "โรงเรียนภูเขียว",
  publisher: "โรงเรียนภูเขียว",
  openGraph: {
    title: "ระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
    description: "ระบบลงทะเบียนเข้าร่วมกิจกรรมต่างๆ ของโรงเรียนภูเขียว สะดวก รวดเร็ว ตรวจสอบสถานะและพิมพ์ประกาศรายชื่อได้ทันที",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://tutor.phukhieo.ac.th/",
    siteName: "ระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
    images: [
      {
        url: "/school_event_registration_platform_banner.jpg",
        width: 1200,
        height: 630,
        alt: "ป้ายประกาศระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ระบบลงทะเบียนเข้าร่วมกิจกรรม โรงเรียนภูเขียว",
    description: "ระบบลงทะเบียนเข้าร่วมกิจกรรมต่างๆ ของโรงเรียนภูเขียว สะดวก รวดเร็ว ตรวจสอบสถานะและพิมพ์ประกาศรายชื่อได้ทันที",
    images: ["/school_event_registration_platform_banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import NextTopLoader from "nextjs-toploader";
import LineBrowserWarning from "./components/LineBrowserWarning";

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
      <body className="min-h-full flex flex-col font-sans">
        <NextTopLoader color="#ec4899" showSpinner={false} />
        <LineBrowserWarning />
        {children}
      </body>
    </html>
  );
}
