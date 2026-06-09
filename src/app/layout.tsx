import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Restaurante POS",
  description: "Sistema POS para restaurante",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="font-sans antialiased min-h-full">{children}</body>
    </html>
  )
}
