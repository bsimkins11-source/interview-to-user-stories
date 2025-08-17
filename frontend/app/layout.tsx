import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '../components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interview ETL - Transform Interviews into User Stories',
  description: 'AI-powered ETL application for processing interview transcripts into structured user stories using Gemini AI and modern web technologies.',
  keywords: ['ETL', 'Interview', 'User Stories', 'AI', 'Gemini', 'Data Processing', 'Next.js', 'FastAPI'],
  authors: [{ name: 'Bryan Simkins' }],
  creator: 'Bryan Simkins',
  publisher: 'Bryan Simkins',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://interview-to-user-stories.vercel.app',
    title: 'Interview ETL - Transform Interviews into User Stories',
    description: 'AI-powered ETL application for processing interview transcripts into structured user stories.',
    siteName: 'Interview ETL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Interview ETL Application',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interview ETL - Transform Interviews into User Stories',
    description: 'AI-powered ETL application for processing interview transcripts into structured user stories.',
    images: ['/og-image.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
