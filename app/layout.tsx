import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Veritix — Event ticketing on Stacks",
  description:
    "Create, sell, and verify event tickets on Stacks. A simple, blockchain-backed event ticketing platform.",
  applicationName: "Veritix",
  keywords: [
    "Veritix",
    "Stacks",
    "STX",
    "event ticketing",
    "blockchain tickets",
    "NFT tickets",
    "Web3 events",
  ],
  authors: [{ name: "Veritix" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Veritix",
    title: "Veritix — Event ticketing on Stacks",
    description:
      "Create, sell, and verify event tickets on Stacks. A simple, blockchain-backed event ticketing platform.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Veritix — Event ticketing on Stacks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veritix — Event ticketing on Stacks",
    description:
      "Create, sell, and verify event tickets on Stacks. A simple, blockchain-backed event ticketing platform.",
    images: ["/logo.png"],
  },
  themeColor: "#6d49ff",
  other: {
    "talentapp:project_verification":
      "be682687148509c05db17a04f16963d2d1465958ede92efc2e57d15d2af7922c4ef6820d0244bae33f977818ea31d93eb0125b5ec98a4aa9c428493e9d2612e7",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <WalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
