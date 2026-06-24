import { HomeClient } from './home-client'

// Server wrapper: emits the Restaurant structured data into the static HTML
// (Google rich results / Maps) and renders the interactive home on top of the
// edge-cached, server-seeded data from the (public) layout.
export const revalidate = 120

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Mallannapeta Kitchen',
  description:
    'Authentic Telangana village-style home-cooked meals from a Jagtial kitchen — Chicken & Rice, Mutton & Rice, Thali combos and Sunday Specials, delivered hot.',
  servesCuisine: ['Telugu', 'Telangana', 'Indian', 'South Indian'],
  priceRange: '₹₹',
  url: 'https://www.mallannapetakitchen.com',
  telephone: '+917993040100',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Jagtial',
    addressRegion: 'Telangana',
    postalCode: '505327',
    addressCountry: 'IN',
  },
  acceptsReservations: false,
  hasMenu: 'https://www.mallannapetakitchen.com/menu',
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
      />
      <HomeClient />
    </>
  )
}
