// Curated, art-directed Indian-food photography (stable Unsplash CDN URLs).
// These are premium placeholders for the redesign — when the kitchen uploads a
// real photo, the API `imageUrl` overrides these everywhere they are used as a
// fallback. The local /images/*.jpg files are the brand logo, not food, so they
// are intentionally NOT used as dish imagery.

const U = (id: string, w = 800, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}${h ? `&h=${h}` : ''}`

export const FOOD = {
  hero: U('1631515243349-e0cb75fb8d3a', 900, 1120),
  sunday: U('1585937421612-70a008356fbe', 1000, 800),
  gallery: [
    U('1567188040759-fb8a883dc6d8', 600, 600),
    U('1631515243349-e0cb75fb8d3a', 600, 600),
    U('1601050690597-df0568f70950', 600, 600),
    U('1574653853027-5382a3d23a15', 600, 600),
    U('1585937421612-70a008356fbe', 600, 600),
  ],
  cards: [
    U('1631515243349-e0cb75fb8d3a'),
    U('1574653853027-5382a3d23a15'),
    U('1585937421612-70a008356fbe'),
    U('1567188040759-fb8a883dc6d8'),
    U('1601050690597-df0568f70950'),
  ],
}

// Deterministic per-item fallback so a given dish always shows the same photo.
export const cardImage = (seed: string) =>
  FOOD.cards[(seed.charCodeAt(seed.length - 1) || 0) % FOOD.cards.length]
