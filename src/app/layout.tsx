import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Complaint2Resolution — AI-Powered Civic Accountability',
  description:
    'Don\'t just register complaints. Drive them to verified resolution with AI-powered classification, SLA tracking, and photographic evidence.',
  keywords: ['civic complaints', 'government portal', 'AI complaint management', 'SIH 2026'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
