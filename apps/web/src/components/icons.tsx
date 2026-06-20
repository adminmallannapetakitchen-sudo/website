import * as React from 'react'

/**
 * Bespoke line-icon set for Mallannapeta Kitchen.
 * One visual language: 24 grid, 1.75 stroke, round caps/joins, currentColor.
 * Hand-built so the brand glyphs (clay pot, spice, rice bowl) are unique to us.
 */

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  strokeWidth?: number
}

function Svg({ size = 24, strokeWidth = 1.75, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ── Brand glyphs ── */

export const PotIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.4 3.2c-.7.9.7 1.6 0 2.6M14.6 3.2c-.7.9.7 1.6 0 2.6" />
    <path d="M3.6 10.5h16.8" />
    <path d="M5 10.5c0 5.4 3 8.6 7 8.6s7-3.2 7-8.6" />
    <path d="M6.6 10.5c0-2.1 2.2-3.4 5.4-3.4s5.4 1.3 5.4 3.4" />
  </Svg>
)

export const FlameIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.4 2.6 2.2 3.4 3.2 5.2A5 5 0 1 1 7 9.6c.4 1.1 1.1 1.6 1.9 1.7-.7-2.3.6-5.4 3.1-8.3Z" />
  </Svg>
)

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19c0-7.5 5.5-12.5 14.5-13C19.5 13.5 14 19 6.5 19c-.9 0-1.5-.4-1.5 0Z" />
    <path d="M9 15.5c2-2.8 4.6-4.6 7.8-5.6" />
  </Svg>
)

export const ChiliIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 5.2c.6 1 .4 2 1.4 2.6" />
    <path d="M8 7.8c4.2 0 8.5 3 8.5 7.6 0 1.4-1 2.1-2.2 2.1C10 17.5 6 13.4 6 9.6c0-1 .8-1.8 2-1.8Z" />
  </Svg>
)

export const BowlIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 11h17" />
    <path d="M5 11c0 4 3.1 7 7 7s7-3 7-7" />
    <path d="M9 7.5c.6-.9 1.8-1.4 3-1.4s2.4.5 3 1.4" />
  </Svg>
)

/* ── UI glyphs ── */

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.7-4.7" />
  </Svg>
)

export const BagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 8h12l-.9 10.5A2 2 0 0 1 15.1 20.4H8.9A2 2 0 0 1 6.9 18.5L6 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5.5v13M5.5 12h13" /></Svg>
)

export const MinusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5.5 12h13" /></Svg>
)

export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.5Z" />
  </Svg>
)

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c4.5-4.3 7-7.8 7-11a7 7 0 1 0-14 0c0 3.2 2.5 6.7 7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h13M12.5 6l6 6-6 6" /></Svg>
)

export const ArrowUpRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 17L17 7M8 7h9v9" /></Svg>
)

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6 9.7V19h12V9.7" />
    <path d="M10 19v-4.5h4V19" />
  </Svg>
)

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.3" />
    <path d="M5.5 19.5c.4-3.3 3.1-5.4 6.5-5.4s6.1 2.1 6.5 5.4" />
  </Svg>
)

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 1.7" /></Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
)

export const SparkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4c.6 3.4 1.6 4.4 5 5-3.4.6-4.4 1.6-5 5-.6-3.4-1.6-4.4-5-5 3.4-.6 4.4-1.6 5-5Z" />
    <path d="M18.5 13c.3 1.4.8 1.9 2.2 2.2-1.4.3-1.9.8-2.2 2.2-.3-1.4-.8-1.9-2.2-2.2 1.4-.3 1.9-.8 2.2-2.2Z" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Svg>
)

export const ReceiptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3V3.5Z" />
    <path d="M9 8h6M9 11.5h6" />
  </Svg>
)

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <path d="M12 14v2.5" />
  </Svg>
)

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M4.5 7.5l7.5 5 7.5-5" />
  </Svg>
)

