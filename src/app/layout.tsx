import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { GoogleAnalytics } from "@/lib/analytics/google-analytics"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "BidVet - Sub Bid Leveling Tool for Construction GCs",
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
    title: "BidVet - Sub Bid Leveling Tool",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleAnalytics />
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
