import type { Metadata } from 'next'
import { MenuClient } from './menu-client'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Browse the full Mallannapeta Kitchen menu — Chicken & Rice, Mutton & Rice, Thali combos, biryani and more, freshly cooked in Jagtial and delivered hot to your door.',
  alternates: { canonical: '/menu' },
  openGraph: {
    title: 'Menu | Mallannapeta Kitchen',
    description: 'Freshly cooked Telangana meals, delivered hot in Jagtial.',
    type: 'website',
  },
}

export default function MenuPage() {
  return <MenuClient />
}
