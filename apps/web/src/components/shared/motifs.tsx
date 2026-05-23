'use client'

import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────────────────────
 * Telangana village-style motifs (Jagtial-inspired)
 * No Charminar — these are folk/village icons:
 *   - Bathukamma (festival flower stack)
 *   - Jowar grain pattern
 *   - Geometric border pattern (kalamkari/warangal saree-edge style)
 *   - Clay matka pot
 *   - Spice particles (chili, cardamom, curry leaf, mustard seed)
 * ──────────────────────────────────────────────────────────────────────────── */

interface MotifProps { className?: string }

/* ── Bathukamma — concentric flower stack (Telangana state festival flower) ── */
export function BathukammaFlower({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 100 100" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* outer ring of 8 petals */}
      {[...Array(8)].map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        const cx = 50 + Math.cos(a) * 30
        const cy = 50 + Math.sin(a) * 30
        return <ellipse key={`o-${i}`} cx={cx} cy={cy} rx="12" ry="6" transform={`rotate(${(i / 8) * 360} ${cx} ${cy})`} fill="currentColor" opacity="0.5" />
      })}
      {/* mid ring of 6 petals */}
      {[...Array(6)].map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        const cx = 50 + Math.cos(a) * 20
        const cy = 50 + Math.sin(a) * 20
        return <ellipse key={`m-${i}`} cx={cx} cy={cy} rx="9" ry="5" transform={`rotate(${(i / 6) * 360} ${cx} ${cy})`} fill="currentColor" opacity="0.75" />
      })}
      {/* center bulb */}
      <circle cx="50" cy="50" r="9" fill="currentColor" />
      <circle cx="50" cy="50" r="3" fill="white" opacity="0.45" />
    </svg>
  )
}

/* ── Jowar grain — repeating sorghum-grain dots ── */
export function JowarGrain({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 100 100" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id="jowarP" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <ellipse cx="7" cy="4" rx="2" ry="3" fill="currentColor" opacity="0.6" />
          <ellipse cx="2" cy="11" rx="1.5" ry="2.5" fill="currentColor" opacity="0.4" />
          <ellipse cx="12" cy="11" rx="1.5" ry="2.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#jowarP)" />
    </svg>
  )
}

/* ── Telangana folk border (zigzag + diamond + dot, kalamkari-inspired) ── */
export function JagtialBorder({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 400 24" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden preserveAspectRatio="none">
      {/* top hairline */}
      <line x1="0" y1="2" x2="400" y2="2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* zigzag */}
      <polyline
        points="0,16 12,6 24,16 36,6 48,16 60,6 72,16 84,6 96,16 108,6 120,16 132,6 144,16 156,6 168,16 180,6 192,16 204,6 216,16 228,6 240,16 252,6 264,16 276,6 288,16 300,6 312,16 324,6 336,16 348,6 360,16 372,6 384,16 396,6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
      />
      {/* tiny diamonds at peaks */}
      {[12, 36, 60, 84, 108, 132, 156, 180, 204, 228, 252, 276, 300, 324, 348, 372].map((x) => (
        <rect key={x} x={x - 1.5} y="4" width="3" height="3" fill="currentColor" transform={`rotate(45 ${x} 5.5)`} opacity="0.9" />
      ))}
      {/* bottom dot row */}
      {[...Array(33)].map((_, i) => (
        <circle key={i} cx={6 + i * 12} cy="22" r="0.9" fill="currentColor" opacity="0.55" />
      ))}
    </svg>
  )
}

/* ── Clay Matka silhouette ── */
export function MatkaPot({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 100 100" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* lid */}
      <ellipse cx="50" cy="22" rx="20" ry="4" fill="currentColor" opacity="0.85" />
      <rect x="46" y="14" width="8" height="6" rx="1" fill="currentColor" opacity="0.85" />
      {/* neck */}
      <path d="M30 24 Q30 30 35 32 L65 32 Q70 30 70 24 Z" fill="currentColor" opacity="0.78" />
      {/* belly */}
      <path d="M22 38 Q22 30 35 32 L65 32 Q78 30 78 38 Q82 60 70 78 Q60 88 50 88 Q40 88 30 78 Q18 60 22 38 Z" fill="currentColor" />
      {/* highlight line */}
      <path d="M30 42 Q34 38 36 40 Q38 42 35 46" stroke="white" strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round" />
      {/* base */}
      <ellipse cx="50" cy="89" rx="15" ry="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

/* ── Spice particles (used as floating elements in hero) ── */
export function SpiceChili({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22 6 Q24 4 26 5 Q28 6 27 8 L24 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 8 Q12 14 6 26 Q10 28 18 22 Q26 14 24 9 Z" fill="#DC2626" />
      <path d="M22 10 Q18 14 14 18" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
    </svg>
  )
}

export function SpiceCardamom({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="16" cy="18" rx="7" ry="11" fill="#86A05A" />
      <line x1="16" y1="7" x2="16" y2="29" stroke="#5A7A3A" strokeWidth="1" />
      <line x1="11" y1="10" x2="11" y2="26" stroke="#5A7A3A" strokeWidth="0.6" opacity="0.6" />
      <line x1="21" y1="10" x2="21" y2="26" stroke="#5A7A3A" strokeWidth="0.6" opacity="0.6" />
      <path d="M16 6 Q14 3 12 4" stroke="#5A7A3A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function SpiceCurryLeaf({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M16 4 Q24 12 20 22 Q14 28 8 22 Q4 14 16 4 Z" fill="#3F7D3F" />
      <path d="M16 4 Q14 14 8 22" stroke="#234D23" strokeWidth="0.8" fill="none" />
      <path d="M14 8 Q12 10 11 13 M16 10 Q14 12 13 15 M18 12 Q16 14 15 17 M20 14 Q18 16 17 19" stroke="#234D23" strokeWidth="0.5" opacity="0.7" fill="none" />
    </svg>
  )
}

export function SpiceMustard({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="14" r="3" fill="#C8983F" />
      <circle cx="20" cy="12" r="3" fill="#C8983F" />
      <circle cx="16" cy="20" r="3" fill="#C8983F" />
      <circle cx="22" cy="20" r="2.5" fill="#A07A2C" />
      <circle cx="10" cy="20" r="2.5" fill="#A07A2C" />
      <circle cx="11" cy="13" r="0.8" fill="white" opacity="0.5" />
      <circle cx="19" cy="11" r="0.8" fill="white" opacity="0.5" />
    </svg>
  )
}

export function SpiceCorianderSeed({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn(className)} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="16" cy="16" rx="7" ry="6.5" fill="#D6B47A" />
      <path d="M9 16 Q16 12 23 16 M9 16 Q16 20 23 16" stroke="#8E6F3D" strokeWidth="0.7" fill="none" opacity="0.7" />
      <path d="M16 9 Q14 16 16 23 M16 9 Q18 16 16 23" stroke="#8E6F3D" strokeWidth="0.7" fill="none" opacity="0.7" />
    </svg>
  )
}
