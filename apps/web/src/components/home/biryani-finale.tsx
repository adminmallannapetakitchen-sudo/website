'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Chicken, Chili, StarAnise, Cardamom, Rice, Onion, Leaf, BiryaniBowl } from './ingredients'

const EASE = [0.23, 1, 0.32, 1] as const

// ingredients scattered around the bowl, each flies inward to the centre
const ORBIT = [
  { C: Chicken,   x: -140, y: -70, r: 12,  size: 78 },
  { C: Chili,     x: 140,  y: -84, r: -14, size: 56 },
  { C: StarAnise, x: 165,  y: 6,   r: 20,  size: 60 },
  { C: Cardamom,  x: -165, y: 18,  r: -10, size: 48 },
  { C: Rice,      x: -92,  y: 96,  r: 8,   size: 74 },
  { C: Onion,     x: 96,   y: 98,  r: 12,  size: 66 },
  { C: Leaf,      x: 8,    y: -128, r: -16, size: 62 },
]

export function BiryaniFinale() {
  const reduce = useReducedMotion()

  if (reduce) {
    // No convergence under reduced motion — just present the finished bowl.
    return (
      <div className="mx-auto w-full max-w-[420px] flex items-center justify-center py-4">
        <BiryaniBowl size={300} />
      </div>
    )
  }

  return (
    <motion.div
      initial="scattered"
      whileInView="mixed"
      viewport={{ once: true, amount: 0.5 }}
      className="relative mx-auto w-full max-w-[460px] h-[300px] sm:h-[360px]"
    >
      {/* ingredients converging in — slow + staggered so each one reads.
          They hold scattered for a beat, then drift inward one after another. */}
      {ORBIT.map(({ C, x, y, r, size }, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center">
          <motion.div
            variants={{
              scattered: { x, y, rotate: r, scale: 1, opacity: 1 },
              mixed: {
                x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0,
                transition: { duration: 2.1, delay: 0.7 + i * 0.28, ease: EASE },
              },
            }}
          >
            <C size={size} style={{ filter: 'drop-shadow(0 8px 14px rgba(43,27,19,0.16))' }} />
          </motion.div>
        </div>
      ))}

      {/* warm flash as it all comes together */}
      <motion.div
        variants={{
          scattered: { opacity: 0, scale: 0.6 },
          mixed: { opacity: [0, 0.55, 0], scale: 1.5, transition: { duration: 1.8, delay: 2.4, ease: EASE } },
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-44 h-44 rounded-full bg-brand-saffron/45 blur-3xl" />
      </motion.div>

      {/* the finished biryani lands with a settle */}
      <motion.div
        variants={{
          scattered: { scale: 0.55, opacity: 0, y: 18 },
          mixed: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 13, delay: 2.7 } },
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <BiryaniBowl size={300} style={{ filter: 'drop-shadow(0 24px 40px rgba(43,27,19,0.22))' }} />
      </motion.div>
    </motion.div>
  )
}
