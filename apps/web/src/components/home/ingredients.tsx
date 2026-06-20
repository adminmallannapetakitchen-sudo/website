import * as React from 'react'

/**
 * Bespoke flat-illustrated ingredients for the "watch the biryani come together"
 * scroll story. One cohesive warm style, viewBox 0 0 100 100, decorative.
 */

type Props = React.SVGProps<SVGSVGElement> & { size?: number | string }

function Art({ size = 80, children, ...rest }: Props & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden {...rest}>
      {children}
    </svg>
  )
}

export const Chicken = (p: Props) => (
  <Art {...p}>
    {/* drumstick meat */}
    <path d="M44 26c18-6 34 6 34 24 0 16-12 27-27 27-12 0-20-8-20-18 0-13 5-26 13-33z" fill="#C57A3A" />
    <path d="M64 34c9 8 9 24-2 33" stroke="#A65E28" strokeWidth="4" strokeLinecap="round" />
    <path d="M48 34c-4 5-6 12-5 19" stroke="#D8975A" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    {/* bone + knuckles */}
    <path d="M38 66L26 78" stroke="#F1E6CF" strokeWidth="8" strokeLinecap="round" />
    <circle cx="22" cy="80" r="5.5" fill="#F1E6CF" />
    <circle cx="29" cy="73" r="4.5" fill="#EADFC6" />
  </Art>
)

export const Chili = (p: Props) => (
  <Art {...p}>
    <path d="M55 24c4-6 13-7 16-2-4 2-8 1-11 6" stroke="#5E7B3A" strokeWidth="5" strokeLinecap="round" />
    <path d="M55 25C71 35 75 61 58 77 47 87 33 82 32 70 45 70 51 60 49 47 48 35 51 29 55 25Z" fill="#A12A22" />
    <path d="M57 33c7 9 8 26-2 38" stroke="#C0392B" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
  </Art>
)

export const StarAnise = (p: Props) => (
  <Art {...p}>
    <g fill="#8A5126">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse key={i} cx="50" cy="50" rx="7" ry="22" transform={`rotate(${i * 45} 50 50)`} />
      ))}
    </g>
    <circle cx="50" cy="50" r="9" fill="#A9683A" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <circle key={i} cx="50" cy="34" r="2.6" fill="#5E3617" transform={`rotate(${i * 45} 50 50)`} />
    ))}
  </Art>
)

export const Cardamom = (p: Props) => (
  <Art {...p}>
    <path d="M50 18c12 6 16 30 8 52-3 8-13 8-16 0-8-22-4-46 8-52z" fill="#86A356" />
    <path d="M50 18c6 3 9 12 9 26s-3 27-9 36" stroke="#5E7B3A" strokeWidth="2.5" opacity="0.7" />
    <path d="M50 20l5 10-5 6-5-6 5-10z" fill="#3F5527" />
  </Art>
)

export const Rice = (p: Props) => (
  <Art {...p}>
    <g fill="#F2E7CC" stroke="#E0CFA6" strokeWidth="1.5">
      <ellipse cx="38" cy="44" rx="5" ry="12" transform="rotate(-24 38 44)" />
      <ellipse cx="56" cy="40" rx="5" ry="12" transform="rotate(18 56 40)" />
      <ellipse cx="48" cy="60" rx="5" ry="12" transform="rotate(-6 48 60)" />
      <ellipse cx="64" cy="58" rx="5" ry="12" transform="rotate(34 64 58)" />
      <ellipse cx="34" cy="64" rx="5" ry="12" transform="rotate(8 34 64)" />
    </g>
  </Art>
)

export const Onion = (p: Props) => (
  <Art {...p}>
    <path d="M50 22c16 0 28 14 28 32 0 16-13 26-28 26S22 70 22 54c0-18 12-32 28-32z" fill="#B07AAE" />
    <path d="M50 22c10 0 18 14 18 32s-8 26-18 26-18-8-18-26 8-32 18-32z" fill="#C99AC7" />
    <path d="M50 30c5 0 9 11 9 24s-4 22-9 22-9-9-9-22 4-24 9-24z" fill="#EAD4E8" />
    <path d="M50 14c3 0 5 4 5 9h-10c0-5 2-9 5-9z" fill="#9A6B98" />
  </Art>
)

export const Leaf = (p: Props) => (
  <Art {...p}>
    <path d="M22 78C22 44 44 24 80 22 80 56 58 78 30 78c-5 0-8-1-8 0z" fill="#5E8A3C" />
    <path d="M30 70C44 50 60 38 76 30" stroke="#3F6427" strokeWidth="3" strokeLinecap="round" />
    <path d="M44 58l-8-4M56 48l-8-5M66 40l-7-5" stroke="#3F6427" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </Art>
)

export const Cinnamon = (p: Props) => (
  <Art {...p}>
    <rect x="36" y="22" width="20" height="56" rx="9" fill="#9A5E2C" transform="rotate(18 46 50)" />
    <rect x="42" y="22" width="9" height="56" rx="4.5" fill="#7C4A22" transform="rotate(18 46 50)" />
    <rect x="48" y="22" width="9" height="56" rx="4.5" fill="#B5793E" transform="rotate(18 46 50)" />
  </Art>
)

/** The finished biryani in a clay bowl — the convergence target. */
export const BiryaniBowl = (p: Props) => (
  <Art {...p} viewBox="0 0 120 100">
    {/* rice mound */}
    <path d="M22 56c8-16 68-16 76 0 4 8-80 8-76 0z" fill="#F2E7CC" />
    <path d="M26 54c6-12 62-12 68 0" stroke="#E4D2A8" strokeWidth="2" opacity="0.7" />
    {/* garnish */}
    <ellipse cx="46" cy="48" rx="8" ry="5.5" fill="#A65E28" />
    <ellipse cx="68" cy="50" rx="7" ry="5" fill="#C57A3A" />
    <path d="M58 40C66 45 67 56 59 62 54 56 54 46 58 40Z" fill="#A12A22" />
    <path d="M40 44c8-4 16-5 22-3" stroke="#5E8A3C" strokeWidth="3.4" strokeLinecap="round" />
    {/* bowl body */}
    <path d="M18 58a42 9 0 0 0 84 0v1a42 30 0 0 1-84 0z" fill="#B5633A" />
    <path d="M18 58a42 9 0 0 0 84 0" stroke="#A12A22" strokeWidth="2.5" />
    <path d="M30 74a30 6 0 0 0 60 0" stroke="#8C4A28" strokeWidth="2" opacity="0.6" />
  </Art>
)

export const INGREDIENTS = [Chicken, Chili, StarAnise, Cardamom, Rice, Onion, Leaf, Cinnamon]
