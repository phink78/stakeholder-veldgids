import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stakeholder Veldgids',
  description: 'Stakeholder mapping voor communicatieadviseurs en NGOs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
