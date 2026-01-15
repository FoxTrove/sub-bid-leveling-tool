import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "BidLevel - Sub Bid Leveling Tool for Construction GCs",
  description:
    "Compare subcontractor bids apples-to-apples with AI. Identify scope gaps, exclusions, and get recommendations in minutes instead of hours.",
  keywords: [
    "sub bid leveling",
    "construction bidding",
    "bid comparison",
    "general contractor",
    "subcontractor bids",
    "construction management",
  ],
  openGraph: {
    title: "BidLevel - Sub Bid Leveling Tool",
    description:
      "Compare subcontractor bids apples-to-apples with AI. Identify scope gaps, exclusions, and get recommendations in minutes.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
