'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, ChefHat, Flame, Clock, Shield, Star, Sparkles, Phone } from 'lucide-react'
import { Hero } from '@/components/shared/hero'
import { MenuCard } from '@/components/menu/menu-card'
import { useLanguageStore } from '@/store/language-store'
import { useMenu, useSundaySpecial } from '@/lib/hooks'
import { kitchenInfo } from '@/lib/mock-data'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ── Animate-in wrapper ── */
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const features = [
  {
    icon: ChefHat, emoji: '👨‍🍳',
    titleEn: 'Home-Style',  titleTe: 'ఇంటి వంట',
    descEn: 'Family recipes passed down through generations.',
    descTe: 'తరాల నుండి వచ్చిన కుటుంబ వంటకాలు.',
    bg: 'bg-brand-red/8',  iconColor: 'text-brand-red',  border: 'border-brand-red/15',
  },
  {
    icon: Flame, emoji: '🔥',
    titleEn: 'Fresh Daily',  titleTe: 'రోజూ తాజాగా',
    descEn: 'New batches prepared every morning — never reheated.',
    descTe: 'ప్రతి ఉదయం తాజా బ్యాచ్‌లు — ఎప్పుడూ పాత కాదు.',
    bg: 'bg-brand-saffron/8', iconColor: 'text-brand-saffron', border: 'border-brand-saffron/15',
  },
  {
    icon: Clock, emoji: '⚡',
    titleEn: '30-45 Min',  titleTe: '30-45 నిమిషాలు',
    descEn: 'Hot meals delivered fast to your doorstep.',
    descTe: 'వేడి వంటలు మీ ఇంటికి వేగంగా.',
    bg: 'bg-brand-gold/8',  iconColor: 'text-amber-600',  border: 'border-brand-gold/20',
  },
  {
    icon: Shield, emoji: '✅',
    titleEn: 'Safe & Hygienic', titleTe: 'సురక్షితం & పరిశుభ్రం',
    descEn: 'Strict hygiene standards, safely packed every order.',
    descTe: 'కఠిన పరిశుభ్రతా ప్రమాణాలు, సురక్షితంగా ప్యాక్.',
    bg: 'bg-green-500/8',  iconColor: 'text-green-600',  border: 'border-green-500/15',
  },
]

const testimonials = [
  { name: 'Suresh K.',   stars: 5, text: "Best mutton curry in Jagtial! Tastes exactly like my grandma's village cooking. Order twice a week now." },
  { name: 'Lakshmi P.', stars: 5, text: 'The Thali Combo is a complete meal. Always arrives hot and fresh. Great value for the whole family.' },
  { name: 'Ravi M.',     stars: 5, text: 'Sunday Thalakaya is a must-try! Real Telangana village flavor. Already ordered 3 Sundays in a row.' },
]

export default function HomePage() {
  const { t, language } = useLanguageStore()
  const { items } = useMenu()
  const featuredItems = items.slice(0, 4)
  const { special: sunday } = useSundaySpecial()

  return (
    <>
      <Hero />

      {/* ── Feature pills strip ── */}
      <section className="section py-10 md:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className={cn(
                'rounded-2xl p-4 md:p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-card',
                f.bg, f.border
              )}>
                <span className="text-2xl md:text-3xl block mb-2">{f.emoji}</span>
                <h3 className={cn(
                  'font-bold text-sm md:text-base text-foreground',
                  language === 'te' ? 'font-telugu text-xs md:text-sm' : ''
                )}>
                  {language === 'te' ? f.titleTe : f.titleEn}
                </h3>
                <p className={cn(
                  'text-xs text-muted-foreground mt-1 leading-relaxed hidden md:block',
                  language === 'te' ? 'font-telugu' : ''
                )}>
                  {language === 'te' ? f.descTe : f.descEn}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Sunday Special banner ── */}
      {sunday && (
        <section className="section pb-10 md:pb-14">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden bg-brand-gradient shadow-brand-lg">
              {/* Animated background blobs */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/8"
                    style={{ width: 80 + i * 50, height: 80 + i * 50, left: `${i * 22}%`, top: `${(i % 3) * 35}%` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3 + i * 0.6, repeat: Infinity }}
                  />
                ))}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 p-6 md:p-8 justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-gold animate-bounce-subtle" />
                    <span className={cn('text-sm font-bold text-white/90 uppercase tracking-wide', language === 'te' ? 'font-telugu normal-case' : '')}>
                      {t.sundaySpecial.title}
                    </span>
                  </div>
                  <h2 className={cn('text-2xl md:text-3xl font-bold text-white', language === 'te' ? 'font-telugu' : 'font-display')}>
                    {language === 'te' ? sunday.menuItem.nameTe : sunday.menuItem.name}
                  </h2>
                  <p className="text-white/75 text-sm max-w-xs">
                    {language === 'te' ? sunday.menuItem.descriptionTe : sunday.menuItem.description}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-2xl font-extrabold text-brand-gold">
                      {formatCurrency(sunday.specialPrice)}
                    </span>
                    <span className="text-white/50 line-through text-sm">
                      {formatCurrency(sunday.menuItem.variants[0].price)}
                    </span>
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      Save {formatCurrency(sunday.menuItem.variants[0].price - sunday.specialPrice)}
                    </span>
                  </div>
                </div>
                <Link href="/sunday-special" className="flex-shrink-0">
                  <Button variant="gold" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}
                    className="!px-6 shadow-warm-lg hover:shadow-warm"
                  >
                    <span className={language === 'te' ? 'font-telugu' : ''}>
                      {language === 'te' ? 'ఆర్డర్ చేయండి' : 'Order Now'}
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Featured menu ── */}
      <section className="section pb-12 md:pb-20">
        <Reveal className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className={cn('section-title', language === 'te' ? 'font-telugu text-2xl md:text-3xl' : '')}>
              {language === 'te' ? 'మా మెను' : 'Our Menu'}
            </h2>
            <p className={cn('section-subtitle', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? 'తాజాగా వండిన వంటలు' : 'Freshly prepared every day'}
            </p>
          </div>
          <Link href="/menu" className="flex-shrink-0">
            <Button variant="outline" size="sm" iconRight={<ArrowRight className="w-4 h-4" />}>
              <span className={language === 'te' ? 'font-telugu text-xs' : ''}>{t.common.viewAll}</span>
            </Button>
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {featuredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <MenuCard {...item} />
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.2} className="text-center mt-8">
          <Link href="/menu">
            <Button size="lg" variant="outline" iconRight={<ArrowRight className="w-5 h-5" />}
              className="!px-8"
            >
              <span className={language === 'te' ? 'font-telugu' : ''}>
                {language === 'te' ? 'పూర్తి మెను చూడండి' : 'View Full Menu'}
              </span>
            </Button>
          </Link>
        </Reveal>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-foreground">
        <div className="section py-14 md:py-20">
          <Reveal className="text-center mb-10">
            <h2 className={cn('text-2xl md:text-3xl font-bold text-white', language === 'te' ? 'font-telugu' : 'font-display')}>
              {language === 'te' ? 'మా వినియోగదారులు చెప్పేది' : 'What Our Customers Say'}
            </h2>
            <p className="text-white/50 text-sm mt-2">
              {language === 'te' ? 'నిజమైన అభిప్రాయాలు' : 'Real reviews from real customers'}
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white/6 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(r.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed">"{r.text}"</p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                    {r.name[0]}
                  </div>
                  <p className="text-white/60 text-xs font-medium">{r.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip — contact / order ── */}
      <section className="section py-14 md:py-20">
        <Reveal>
          <div className="rounded-3xl bg-hero-gradient border border-border p-8 md:p-12 text-center shadow-card">
            <span className="text-4xl">🍛</span>
            <h2 className={cn('text-2xl md:text-3xl font-bold text-foreground mt-4 mb-3', language === 'te' ? 'font-telugu' : 'font-display')}>
              {language === 'te' ? 'ఆకలేస్తోందా? ఆర్డర్ చేయండి!' : 'Hungry? Order Now!'}
            </h2>
            <p className={cn('text-muted-foreground mb-7 max-w-md mx-auto', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te'
                ? '30-45 నిమిషాల్లో మీ ఇంటికి తాజా ఆహారం. రోజూ తాజాగా వండుతాం.'
                : 'Fresh Telangana village meals at your door in 30-45 minutes. Slow-cooked fresh every single day.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/menu">
                <Button size="xl" icon={<Flame className="w-5 h-5" />} iconRight={<ArrowRight className="w-5 h-5" />}
                  className="!px-10 shadow-brand-lg"
                >
                  <span className={language === 'te' ? 'font-telugu' : ''}>
                    {language === 'te' ? 'ఇప్పుడే ఆర్డర్ చేయండి' : 'Order Now'}
                  </span>
                </Button>
              </Link>
              <a href={`tel:${kitchenInfo.phone}`}>
                <Button variant="outline" size="xl" icon={<Phone className="w-5 h-5" />}
                  className="!px-10"
                >
                  <span className={language === 'te' ? 'font-telugu' : ''}>
                    {language === 'te' ? 'కాల్ చేయండి' : 'Call Us'}
                  </span>
                </Button>
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
