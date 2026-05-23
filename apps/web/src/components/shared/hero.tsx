'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Star, Clock, ShieldCheck, Flame, Sparkles, MapPin } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'
import { Button } from '@/components/ui/button'
import { kitchenInfo } from '@/lib/mock-data'
import { useKitchenSettings } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import {
  BathukammaFlower,
  JagtialBorder,
  JowarGrain,
  SpiceChili,
  SpiceCardamom,
  SpiceCurryLeaf,
  SpiceMustard,
  SpiceCorianderSeed,
} from './motifs'

/* Floating spice particles drifting up across the stage */
const PARTICLES = [
  { Cmp: SpiceChili,         start: { x: 8, y: 88 },  size: 28, dur: 11, delay: 0 },
  { Cmp: SpiceCardamom,      start: { x: 22, y: 96 }, size: 22, dur: 13, delay: 1.5 },
  { Cmp: SpiceCurryLeaf,     start: { x: 78, y: 92 }, size: 26, dur: 12, delay: 0.8 },
  { Cmp: SpiceMustard,       start: { x: 88, y: 85 }, size: 20, dur: 14, delay: 2.4 },
  { Cmp: SpiceCorianderSeed, start: { x: 38, y: 90 }, size: 18, dur: 10, delay: 1.2 },
  { Cmp: SpiceChili,         start: { x: 62, y: 94 }, size: 22, dur: 12.5, delay: 3.0 },
  { Cmp: SpiceCardamom,      start: { x: 50, y: 88 }, size: 18, dur: 11.5, delay: 0.4 },
  { Cmp: SpiceCurryLeaf,     start: { x: 14, y: 80 }, size: 20, dur: 13, delay: 2 },
]

const stats = [
  { icon: Star,         value: '4.9',   label: 'Rating',       labelTe: 'రేటింగ్'      },
  { icon: Clock,        value: '30-45', label: 'Min delivery', labelTe: 'నిమిషాల్లో'   },
  { icon: ShieldCheck,  value: '100%',  label: 'Fresh daily',  labelTe: 'తాజా వంట'    },
]

export function Hero() {
  const { t, language } = useLanguageStore()
  // Use the real kitchen status, not the always-"Open" mock.
  const { settings } = useKitchenSettings()
  const kitchenOpen = settings ? !!settings.isOpen : false
  const openingHours = settings?.openingHours ?? kitchenInfo.openingHours
  const openingHoursTe = settings?.openingHoursTe ?? kitchenInfo.openingHoursTe
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const stageY  = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative min-h-[94vh] md:min-h-screen flex items-center overflow-hidden bg-hero-gradient"
    >
      {/* ── Warm background blobs + village-style decoration ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[560px] h-[560px] bg-brand-saffron/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-brand-gold/12 rounded-full blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-90" />

        {/* Bathukamma flower decoration — top-left corner */}
        <div className="absolute -top-20 -left-20 w-[280px] h-[280px] text-brand-saffron/20">
          <BathukammaFlower className="w-full h-full" />
        </div>
        {/* Jowar grain decoration — bottom-right */}
        <div className="absolute bottom-10 right-6 w-32 h-32 text-brand-red/15 hidden md:block">
          <JowarGrain className="w-full h-full" />
        </div>
      </div>

      {/* ── Top folk-border accent ── */}
      <div className="absolute top-16 md:top-20 left-0 right-0 text-brand-red/25 pointer-events-none">
        <JagtialBorder className="w-full h-4" />
      </div>

      <motion.div style={{ opacity }} className="section relative z-10 py-12 md:py-16 lg:py-20 w-full">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* ─────────────────────────  LEFT — typography stage  ───────────────────────── */}
          <div className="relative space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">

            {/* Region badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-sm border border-brand-red/15 rounded-full px-3.5 py-1.5 mx-auto lg:mx-0 shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span className="text-[11px] font-bold text-brand-red tracking-[0.18em] uppercase">
                Jagtial · Telangana
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-saffron" />
              <span className={cn('text-[11px] font-semibold text-foreground/70', language === 'te' ? 'font-telugu' : '')}>
                {language === 'te' ? 'గ్రామ వంట' : 'Village Kitchen'}
              </span>
            </motion.div>

            {/* MASSIVE Telugu hero word — రుచి (taste) */}
            <div className="relative">
              <motion.h1
                initial={{ opacity: 0, y: 30, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="font-telugu font-bold leading-none select-none relative"
              >
                <span
                  className="block text-[7rem] sm:text-[9rem] md:text-[11rem] lg:text-[10rem] xl:text-[13rem] tracking-tight bg-gradient-to-br from-brand-red via-brand-saffron to-brand-gold bg-clip-text text-transparent drop-shadow-sm"
                  style={{
                    WebkitTextStroke: '1px rgba(184,51,42,0.15)',
                  }}
                >
                  రుచి
                </span>
                {/* Subtle echo/shadow word behind */}
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 font-telugu text-[7rem] sm:text-[9rem] md:text-[11rem] lg:text-[10rem] xl:text-[13rem] tracking-tight text-brand-red/8 blur-sm -translate-y-2 translate-x-2"
                >
                  రుచి
                </span>
              </motion.h1>

              {/* English overlay */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex items-baseline gap-3 mt-1 justify-center lg:justify-start"
              >
                <span className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl text-foreground tracking-tight leading-tight">
                  Taste of <span className="gradient-text">Telangana</span>
                </span>
              </motion.div>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className={cn(
                'text-base md:text-lg text-foreground/65 max-w-md mx-auto lg:mx-0 leading-relaxed',
                language === 'te' ? 'font-telugu' : ''
              )}
            >
              {language === 'te'
                ? 'జగిత్యాల గ్రామ వంటశాల నుండి — తెలంగాణ రుచులు, ఇంట్లో వండినట్టే, మీ ఇంటికే.'
                : 'From a village kitchen in Jagtial — slow-cooked Telangana classics, just like home, delivered hot to your door.'}
            </motion.p>

            {/* Kitchen status pill — reflects the real open/closed state */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="flex items-center gap-2 justify-center lg:justify-start"
            >
              <span className="relative flex h-2.5 w-2.5">
                {kitchenOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2.5 w-2.5',
                    kitchenOpen ? 'bg-green-500' : 'bg-red-500',
                  )}
                />
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  kitchenOpen ? 'text-green-700' : 'text-red-600',
                )}
              >
                {kitchenOpen
                  ? language === 'te'
                    ? `తెరిచి ఉంది · ${openingHoursTe}`
                    : `Open now · ${openingHours}`
                  : language === 'te'
                    ? 'ప్రస్తుతం మూసివేయబడింది'
                    : 'Currently closed'}
              </span>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Link href="/menu">
                <Button size="lg" className="w-full sm:w-auto !px-8 !py-4 !text-base shadow-brand hover:shadow-brand-lg"
                  icon={<Flame className="w-5 h-5" />}
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  <span className={language === 'te' ? 'font-telugu' : ''}>{t.hero.cta}</span>
                </Button>
              </Link>
              <Link href="/sunday-special">
                <Button variant="outline" size="lg" className="w-full sm:w-auto !px-8 !py-4 !text-base"
                  icon={<Sparkles className="w-5 h-5 text-brand-saffron" />}
                >
                  <span className={language === 'te' ? 'font-telugu' : ''}>
                    {language === 'te' ? 'ఆదివారం స్పెషల్' : 'Sunday Special'}
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="flex gap-7 justify-center lg:justify-start pt-2"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                    <stat.icon className="w-3.5 h-3.5 text-brand-saffron" />
                    <span className="text-lg font-extrabold text-foreground">{stat.value}</span>
                  </div>
                  <p className={cn('text-[11px] text-foreground/55 font-medium', language === 'te' ? 'font-telugu' : '')}>
                    {language === 'te' ? stat.labelTe : stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ─────────────────────────  RIGHT — clay-pot stage  ───────────────────────── */}
          <motion.div
            style={{ y: stageY }}
            className="relative flex justify-center lg:justify-end order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.25, type: 'spring', damping: 22, stiffness: 110 }}
              className="relative w-[300px] h-[380px] sm:w-[360px] sm:h-[440px] md:w-[420px] md:h-[520px]"
            >
              {/* ── Outer stage frame with folk border ── */}
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-float"
                style={{
                  background:
                    'radial-gradient(ellipse at center, #FFE5B0 0%, #F4B847 35%, #E8841F 75%, #B8332A 110%)',
                }}
              >
                {/* Inner radial highlight */}
                <div className="absolute inset-0" style={{
                  background:
                    'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.55) 0%, transparent 45%)',
                }} />

                {/* Top folk border (gold) */}
                <div className="absolute top-3 left-3 right-3 text-brand-red/40">
                  <JagtialBorder className="w-full h-3.5" />
                </div>
                {/* Bottom folk border */}
                <div className="absolute bottom-3 left-3 right-3 text-brand-red/40 rotate-180">
                  <JagtialBorder className="w-full h-3.5" />
                </div>

                {/* Bathukamma silhouette behind logo */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[280px] h-[280px] md:w-[360px] md:h-[360px] text-white/15 pointer-events-none"
                >
                  <BathukammaFlower className="w-full h-full" />
                </motion.div>

                {/* ── Spice particles drifting up ── */}
                {PARTICLES.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: `${p.start.x}%`, y: `${p.start.y}%`, opacity: 0 }}
                    animate={{
                      y: ['100%', '-15%'],
                      x: [`${p.start.x}%`, `${p.start.x + (i % 2 === 0 ? 10 : -10)}%`],
                      opacity: [0, 0.85, 0.85, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: p.dur,
                      delay: p.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute pointer-events-none"
                    style={{ width: p.size, height: p.size }}
                  >
                    <p.Cmp className="w-full h-full drop-shadow-md" />
                  </motion.div>
                ))}

                {/* ── Centerpiece: clay-pot logo with steam ── */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Steam wisps above logo */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none">
                      <span className="block w-1.5 h-8 bg-white/55 rounded-full blur-[4px] steam-1" />
                      <span className="block w-1.5 h-10 bg-white/55 rounded-full blur-[4px] steam-2" />
                      <span className="block w-1.5 h-7 bg-white/55 rounded-full blur-[4px] steam-3" />
                    </div>

                    {/* Logo halo */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                      className="absolute -inset-3 rounded-full"
                      style={{
                        background:
                          'conic-gradient(from 0deg, rgba(244,184,71,0.0) 0deg, rgba(244,184,71,0.7) 80deg, rgba(255,255,255,0.0) 180deg, rgba(244,184,71,0.7) 280deg, rgba(244,184,71,0.0) 360deg)',
                        filter: 'blur(8px)',
                      }}
                    />

                    {/* Logo */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-[6px] border-white/85 shadow-2xl ring-4 ring-brand-red/20"
                    >
                      <Image
                        src="/logo.jpeg"
                        alt="Mallannapeta Kitchen"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 208px, 240px"
                        priority
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Stage label at bottom */}
                <div className="absolute bottom-7 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/85 backdrop-blur-sm rounded-full shadow-md">
                  <p className={cn('text-[11px] font-bold text-brand-red tracking-[0.2em] uppercase whitespace-nowrap',
                    language === 'te' ? 'font-telugu normal-case tracking-normal text-xs' : ''
                  )}>
                    {language === 'te' ? 'తెలంగాణ గ్రామ వంట' : 'A Telangana Village Kitchen'}
                  </p>
                </div>
              </div>

              {/* ── Floating info chips on stage corners ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 240, damping: 18 }}
                className="absolute top-4 -left-3 sm:-left-6 bg-white rounded-2xl shadow-warm-lg px-3 py-2 flex items-center gap-2 border border-brand-saffron/20"
              >
                <span className="text-xl">⭐</span>
                <div>
                  <p className="text-xs font-extrabold text-foreground leading-none">4.9</p>
                  <p className="text-[10px] text-foreground/55 mt-0.5">500+ orders</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 240, damping: 18 }}
                className="absolute bottom-12 -right-3 sm:-right-6 bg-white rounded-2xl shadow-warm-lg px-3 py-2 flex items-center gap-2 border border-brand-red/20"
              >
                <span className="text-xl">🔥</span>
                <div>
                  <p className={cn('text-xs font-extrabold text-foreground leading-none', language === 'te' ? 'font-telugu' : '')}>
                    {language === 'te' ? 'రోజూ తాజా' : '30-45 min'}
                  </p>
                  <p className="text-[10px] text-foreground/55 mt-0.5">
                    {language === 'te' ? 'వండుతాం' : 'Hot delivery'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] text-foreground/50 font-medium tracking-[0.25em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border-2 border-foreground/20 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-brand-red/55 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
