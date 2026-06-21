'use client'

import { useEffect, useState } from 'react'
import {
  motion, useScroll, useTransform, useMotionTemplate, useReducedMotion,
  type MotionValue,
} from 'framer-motion'
import { Chicken, Chili, StarAnise, Rice, Onion, Leaf, Cardamom } from './ingredients'

/**
 * Ingredients that travel down the page as you scroll.
 * Desktop: they sweep across (and a little past) the edges for drama.
 * Mobile: a smaller, contained subset that stays FULLY on-screen (never cut)
 * and sits in the side margins so it doesn't fight the centered content.
 */

type Glide = {
  C: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  spin: number
  xs: number[]; ys: number[]; size: number      // desktop (vw / vh)
  mxs?: number[]; mys?: number[]; msize?: number // mobile (contained)
  mobile: boolean
}

const STOPS = [0, 0.35, 0.7, 1]

const GLIDERS: Glide[] = [
  { C: Chicken,   spin: 300,  xs: [-14, 26, 60, 47], ys: [10, 34, 60, 78], size: 92, mxs: [11, 16, 22, 17], mys: [9, 30, 56, 80], msize: 48, mobile: true },
  { C: Chili,     spin: -260, xs: [112, 72, 38, 53], ys: [6, 30, 56, 82],  size: 60, mxs: [88, 84, 80, 86], mys: [8, 30, 55, 82], msize: 40, mobile: true },
  { C: StarAnise, spin: 420,  xs: [86, 50, 18, 50],  ys: [18, 42, 64, 76], size: 66, mobile: false },
  { C: Cardamom,  spin: -260, xs: [78, 40, 70, 48],  ys: [14, 46, 66, 80], size: 52, mobile: false },
  { C: Rice,      spin: 160,  xs: [-10, 32, 66, 46], ys: [26, 50, 70, 84], size: 84, mxs: [12, 15, 20, 16], mys: [42, 56, 72, 88], msize: 44, mobile: true },
  { C: Onion,     spin: -200, xs: [106, 58, 28, 52], ys: [32, 54, 68, 80], size: 74, mobile: false },
  { C: Leaf,      spin: 240,  xs: [12, 46, 82, 50],  ys: [42, 60, 74, 86], size: 68, mxs: [86, 83, 80, 85], mys: [44, 60, 76, 90], msize: 42, mobile: true },
]

function Glider({ g, progress, isMobile }: { g: Glide; progress: MotionValue<number>; isMobile: boolean }) {
  const useMobile = isMobile && g.mxs && g.mys
  const xs = useMobile ? g.mxs! : g.xs
  const ys = useMobile ? g.mys! : g.ys
  const size = useMobile ? (g.msize ?? g.size) : g.size

  const tx = useTransform(progress, STOPS, xs)
  const ty = useTransform(progress, STOPS, ys)
  const x = useMotionTemplate`${tx}vw`
  const y = useMotionTemplate`${ty}vh`
  const rotate = useTransform(progress, [0, 1], [0, g.spin])
  // Fade fully out by ~78% scroll — BEFORE the closing "Hungry now?" finale
  // (which centers ~92%). The BiryaniFinale's own convergence takes over there,
  // so the floating gliders must be gone, not lingering over the bowl.
  const opacity = useTransform(
    progress,
    [0, 0.04, 0.66, 0.78],
    isMobile ? [0.3, 0.5, 0.5, 0] : [0.55, 0.85, 0.85, 0],
  )
  const Comp = g.C
  return (
    <motion.div style={{ x, y, opacity }} className="absolute top-0 left-0 z-0">
      <motion.div style={{ rotate, marginLeft: -size / 2, marginTop: -size / 2 }}>
        <Comp size={size} style={{ filter: 'drop-shadow(0 8px 14px rgba(43,27,19,0.14))' }} />
      </motion.div>
    </motion.div>
  )
}

export function IngredientJourney({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const reduce = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ['start start', 'end end'] })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (reduce) return null

  const shown = GLIDERS.filter((g) => !isMobile || g.mobile)

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transform-gpu">
      {shown.map((g, i) => (
        <Glider key={`${isMobile ? 'm' : 'd'}-${i}`} g={g} progress={scrollYProgress} isMobile={isMobile} />
      ))}
    </div>
  )
}
