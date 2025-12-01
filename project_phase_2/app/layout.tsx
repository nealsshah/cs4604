import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Job Applicant Tracking System',
  description: 'Manage job applications and recruitment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

