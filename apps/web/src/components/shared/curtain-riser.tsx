'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { BathukammaFlower, JagtialBorder } from './motifs'

const STORAGE_KEY = 'mk-intro-seen-v1'

/* Public helper — used by footer "Replay intro" link */
export function replayIntro() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.location.reload()
}

export function CurtainRiser() {
  // null = haven't decided yet (avoids SSR/CSR flash)
  const [show, setShow] = useState<boolean | null>(null)

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY)
    setShow(!seen)
  }, [])

  useEffect(() => {
    if (show !== true) return
    document.body.classList.add('no-scroll')
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, '1')
      setShow(false)
      document.body.classList.remove('no-scroll')
    }, 2800)
    return () => {
      window.clearTimeout(timer)
      document.body.classList.remove('no-scroll')
    }
  }, [show])

  if (show !== true) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="curtain-root"
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto overflow-hidden"
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Left curtain panel ── */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: '-105%' }}
            transition={{ duration: 0.85, delay: 1.95, ease: [0.86, 0, 0.07, 1] }}
            className="absolute top-0 left-0 w-1/2 h-full bg-brand-red overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(circle at 75% 35%, rgba(244,184,71,0.25) 0%, transparent 55%), radial-gradient(circle at 30% 85%, rgba(232,132,31,0.3) 0%, transparent 50%)',
            }}
          >
            <div className="absolute inset-0 dot-pattern opacity-25" />
            {/* Telangana folk border on right edge */}
            <div className="absolute top-0 right-0 h-full w-6 flex flex-col">
              <div className="flex-1 text-brand-gold/70 rotate-90 origin-top-right translate-x-6">
                <JagtialBorder className="w-[200vh] h-6" />
              </div>
            </div>
          </motion.div>

          {/* ── Right curtain panel ── */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ duration: 0.85, delay: 1.95, ease: [0.86, 0, 0.07, 1] }}
            className="absolute top-0 right-0 w-1/2 h-full bg-brand-red overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 35%, rgba(244,184,71,0.25) 0%, transparent 55%), radial-gradient(circle at 70% 85%, rgba(232,132,31,0.3) 0%, transparent 50%)',
            }}
          >
            <div className="absolute inset-0 dot-pattern opacity-25" />
            {/* Telangana folk border on left edge */}
            <div className="absolute top-0 left-0 h-full w-6">
              <div className="text-brand-gold/70 -rotate-90 origin-top-left">
                <JagtialBorder className="w-[200vh] h-6" />
              </div>
            </div>
          </motion.div>

          {/* ── Center stage content ── */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6"
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.4, delay: 1.55 }}
          >
            {/* Decorative bathukamma flower behind logo */}
            <motion.div
              initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
              animate={{ opacity: 0.18, rotate: 0, scale: 1 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] text-brand-gold pointer-events-none"
            >
              <BathukammaFlower className="w-full h-full" />
            </motion.div>

            {/* Logo (rotates 360° while scaling in) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-brand-gold/60 ring-4 ring-white/20"
            >
              <Image src="/logo.jpeg" alt="Mallannapeta" fill className="object-cover" priority sizes="160px" />
              {/* glow ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0%, rgba(244,184,71,0.6) 25%, transparent 50%, rgba(244,184,71,0.6) 75%, transparent 100%)',
                  mixBlendMode: 'screen',
                }}
              />
            </motion.div>

            {/* Telugu wordmark — animated as one unit.
               Telugu is a complex script (conjuncts + combining vowel signs),
               so it must NOT be split per code unit or the shaper breaks the
               glyphs. Render the whole word in a single element. */}
            <motion.h1
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="font-telugu text-4xl sm:text-5xl md:text-6xl text-white font-bold mt-6 drop-shadow-lg"
            >
              మల్లన్నపేట
            </motion.h1>

            {/* English subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.45 }}
              className="font-display text-base sm:text-lg text-brand-gold/95 mt-2 tracking-[0.3em] uppercase font-semibold"
            >
              Mallannapeta Kitchen
            </motion.p>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.65 }}
              className="mt-5 flex items-center gap-3"
            >
              <span className="block w-8 h-px bg-brand-gold/60" />
              <p className="text-white/90 text-sm sm:text-base font-medium tracking-wider">
                Taste of Telangana — From Jagtial
              </p>
              <span className="block w-8 h-px bg-brand-gold/60" />
            </motion.div>
          </motion.div>

          {/* ── Top + bottom Telangana folk borders ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-20 text-brand-gold/85 pointer-events-none"
          >
            <JagtialBorder className="w-full h-5" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-20 text-brand-gold/85 pointer-events-none rotate-180"
          >
            <JagtialBorder className="w-full h-5" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
