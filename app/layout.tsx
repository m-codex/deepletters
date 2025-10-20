import type { Metadata } from "next";
import "./globals.css";
import SupabaseProvider from "@/_components/SupabaseProvider";

export const metadata: Metadata = {
  title: "Deepletters - Send meaningful letters",
  description: "Send meaningful, heartfelt letters to your loved ones. Deepletters allows you to create and share beautiful, personalized digital letters with ease.",
  keywords: "digital letters, meaningful communication, personalized messages, heartfelt letters, online letters",
  openGraph: {
    title: "Deepletters - Send meaningful letters",
    description: "Send meaningful, heartfelt letters to your loved ones. Deepletters allows you to create and share beautiful, personalized digital letters with ease.",
    url: "https://deepletters.com",
    siteName: "Deepletters",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Deepletters - Send meaningful letters",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deepletters - Send meaningful letters",
    description: "Send meaningful, heartfelt letters to your loved ones. Deepletters allows you to create and share beautiful, personalized digital letters with ease.",
    images: ["/images/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/images/favicon/favicon-16x16.png", sizes: "16x16" },
      { url: "/images/favicon/favicon-32x32.png", sizes: "32x32" },
      { url: "/images/favicon/favicon-96x96.png", sizes: "96x96" },
    ],
    apple: [
      { url: "/images/favicon/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/images/favicon/apple-touch-icon-60x60.png", sizes: "60x60" },
      { url: "/images/favicon/apple-touch-icon-72x72.png", sizes: "72x72" },
      { url: "/images/favicon/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/images/favicon/apple-touch-icon-114x114.png", sizes: "114x114" },
      { url: "/images/favicon/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/images/favicon/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/images/favicon/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/images/favicon/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: 'shortcut icon',
        url: '/images/favicon/favicon.ico',
      },
      {
        rel: 'mask-icon',
        url: '/images/favicon/safari-pinned-tab.svg',
        color: '#5bbad5',
      },
    ],
  },
  other: {
    "msapplication-TileColor": "#262626",
    "msapplication-TileImage": "/images/favicon/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
