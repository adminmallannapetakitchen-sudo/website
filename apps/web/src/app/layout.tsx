import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { CurtainRiser } from '@/components/shared/curtain-riser'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mallannapetakitchen.com'),
  title: {
    default: 'Mallannapeta Kitchen | Authentic Telangana Village Food',
    template: '%s | Mallannapeta Kitchen',
  },
  description:
    'Order authentic Telangana village-style home-cooked meals from a Jagtial kitchen. Fresh Chicken & Rice, Mutton & Rice, Thali Combos and Sunday Specials, delivered hot to your door.',
  keywords: ['Telangana food', 'Jagtial', 'home delivery', 'village kitchen', 'Telugu food', 'Mallannapeta'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mallannapeta Kitchen | Authentic Telangana Village Food',
    description: 'Taste of Telangana: village-style home-cooked meals from Jagtial, delivered hot.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Mallannapeta Kitchen',
    url: 'https://www.mallannapetakitchen.com',
    images: [{ url: '/logo.jpeg', width: 512, height: 512, alt: 'Mallannapeta Kitchen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mallannapeta Kitchen',
    description: 'Village-style home-cooked Telangana meals from Jagtial, delivered hot.',
    images: ['/logo.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#B8332A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <CurtainRiser />
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif' },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
