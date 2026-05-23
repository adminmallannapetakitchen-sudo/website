import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { CurtainRiser } from '@/components/shared/curtain-riser'

export const metadata: Metadata = {
  title: {
    default: 'Mallannapeta Kitchen | Authentic Telangana Village Food',
    template: '%s | Mallannapeta Kitchen',
  },
  description:
    'Order authentic Telangana village-style home-cooked meals from a Jagtial kitchen. Fresh Chicken & Rice, Mutton & Rice, Thali Combos and Sunday Specials — delivered hot to your door.',
  keywords: ['Telangana food', 'Jagtial', 'home delivery', 'village kitchen', 'Telugu food', 'Mallannapeta'],
  openGraph: {
    title: 'Mallannapeta Kitchen',
    description: 'Taste of Telangana — village-style home-cooked meals from Jagtial.',
    type: 'website',
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
      </body>
    </html>
  )
}
