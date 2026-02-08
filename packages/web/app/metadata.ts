import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Caribto - Crypto for the Caribbean",
  description:
    "Buy USDC with your local Caribbean currency. Fast, secure, and delivered straight to your wallet.",
  keywords:
    "crypto, caribbean, USDC, buy crypto, onramp, Trinidad and Tobago, Barbados, Jamaica, stablecoin, Base, fiat to crypto",
  authors: [{ name: "Caribto" }],
  creator: "Caribto",
  publisher: "Caribto",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.caribto.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Caribto - Crypto for the Caribbean",
    description:
      "Buy USDC with your local Caribbean currency. Fast, secure, and delivered straight to your wallet.",
    url: "https://www.caribto.com",
    siteName: "Caribto",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Caribto - Crypto for the Caribbean",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caribto - Crypto for the Caribbean",
    description:
      "Buy USDC with your local Caribbean currency. Fast, secure, and delivered straight to your wallet.",
    images: ["/api/og"],
    creator: "@caribto_",
  },
};
