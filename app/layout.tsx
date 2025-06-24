import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PreferencesProvider } from "@/hooks/use-preferences"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Calendario Unificado",
  description: "Visualiza tus calendarios de Google y Microsoft en un solo lugar",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PreferencesProvider>
            {children}
            <Toaster />
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
