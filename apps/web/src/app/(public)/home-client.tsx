'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { IngredientJourney } from '@/components/home/ingredient-journey'
import { BiryaniFinale } from '@/components/home/biryani-finale'
import {
  FlameIcon, ClockIcon, LeafIcon, ArrowRightIcon, ArrowUpRightIcon,
  StarIcon, PinIcon,
} from '@/components/icons'
import { useLanguageStore } from '@/store/language-store'
import { useMenu, useSundaySpecial, useKitchenSettings } from '@/lib/hooks'
import { FOOD, cardImage } from '@/lib/food-images'
import { formatCurrency, cn } from '@/lib/utils'

const EASE = [0.23, 1, 0.32, 1] as const

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={cn('snap-section relative z-10 md:min-h-[100svh] md:flex md:flex-col md:justify-center py-20 md:py-24', className)}
    >
      {children}
    </section>
  )
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE, delay }} className={className}>
      {children}
    </motion.div>
  )
}

// Scroll-active text: each word darkens from faint to full black as the line
// scrolls through the viewport — an editorial "reading" reveal.
function ScrollWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return <motion.span style={{ opacity }} className="inline-block">{children}&nbsp;</motion.span>
}

function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={cn('text-foreground', className)}>
      {words.map((w, i) => (
        <ScrollWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </ScrollWord>
      ))}
    </p>
  )
}

export function HomeClient() {
  const { language } = useLanguageStore()
  const { items } = useMenu()
  const { special: sunday } = useSundaySpecial()
  const { settings } = useKitchenSettings()
  const kitchenOpen = settings ? !!settings.isOpen : false
  const pageRef = useRef<HTMLDivElement>(null)

  // Turn on full-screen snap only on this page (CSS gates it to desktop + motion-ok).
  useEffect(() => {
    document.documentElement.classList.add('home-snap')
    return () => document.documentElement.classList.remove('home-snap')
  }, [])

  const signature = (items.length ? items.filter((i) => i.isBestseller).concat(items) : []).slice(0, 3)

  const heroStagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
  const heroItem = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } }

  return (
    <div ref={pageRef} className="relative bg-hero-gradient">
      <IngredientJourney targetRef={pageRef} />

      {/* ───────── 01 · HERO ───────── */}
      <Section className="md:justify-center">
        <div className="section text-center">
          <motion.div variants={heroStagger} initial="hidden" animate="show" className="flex flex-col items-center">
            <motion.span variants={heroItem} className="eyebrow">
              {language === 'te' ? 'జగిత్యాల · తెలంగాణ' : 'Jagtial · Telangana'}
            </motion.span>

            <motion.h1
              variants={heroItem}
              className={cn(
                'mt-5 font-display font-bold text-foreground tracking-tight leading-[0.98] text-balance break-words',
                'text-[clamp(2.05rem,9vw,7rem)] sm:leading-[0.95]',
                language === 'te' ? 'font-telugu leading-tight' : '',
              )}
            >
              {language === 'te' ? (
                <>నెమ్మదిగా వండిన<br /><span className="text-brand-red">తెలంగాణ రుచి.</span></>
              ) : (
                <>Slow-cooked<br /><span className="text-brand-red">Telangana.</span></>
              )}
            </motion.h1>

            <motion.p variants={heroItem} className={cn('mt-6 text-base md:text-lg text-foreground/60 max-w-[40ch] leading-relaxed', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te'
                ? 'జగిత్యాల ఇంటి వంటశాల నుండి కుటుంబ వంటకాలు, తాజాగా మీ ఇంటికే.'
                : 'Family recipes from a home kitchen in Jagtial, brought fresh to your door.'}
            </motion.p>

            <motion.div variants={heroItem} className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/menu" className="btn-brand px-8 py-4 text-base justify-center">
                {language === 'te' ? 'మెను చూడండి' : 'See the menu'} <ArrowRightIcon size={18} />
              </Link>
              <Link href="/sunday-special" className="btn-outline px-8 py-4 text-base justify-center">
                {language === 'te' ? 'ఆదివారం స్పెషల్' : 'Sunday Special'}
              </Link>
            </motion.div>

            <motion.div variants={heroItem} className="mt-8 flex items-center gap-5 text-sm text-foreground/55">
              <span className="flex items-center gap-1.5"><StarIcon filled size={16} className="text-brand-gold" /><b className="text-foreground/80">4.9</b></span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1.5"><ClockIcon size={16} className="text-brand-saffron" /><b className="text-foreground/80">30-45</b> {language === 'te' ? 'నిమి' : 'min'}</span>
              <span className="w-px h-4 bg-border" />
              <span className={cn('flex items-center gap-1.5 font-medium', kitchenOpen ? 'text-green-700' : 'text-red-600')}>
                <span className={cn('w-2 h-2 rounded-full', kitchenOpen ? 'bg-green-600' : 'bg-red-500')} />
                {kitchenOpen ? (language === 'te' ? 'తెరిచి' : 'Open') : (language === 'te' ? 'మూసి' : 'Closed')}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* ───────── 02 · PROMISE ───────── */}
      <Section>
        <div className="section">
          <p className="eyebrow mb-6">{language === 'te' ? 'మా మాట' : 'Our promise'}</p>
          <ScrollRevealText
            text={language === 'te' ? 'ఇంట్లో వండినట్టే. ఆ ఉదయమే తాజాగా, ఎప్పుడూ పాతది కాదు.' : 'Cooked like home. Fresh that morning, never the day before.'}
            className={cn('font-display font-medium tracking-tight max-w-[16ch] text-[clamp(2rem,6vw,4rem)] leading-[1.12]', language === 'te' ? 'font-telugu leading-snug max-w-[18ch]' : '')}
          />
        </div>
      </Section>

      {/* ───────── 03 · SIGNATURE DISHES ───────── */}
      <Section>
        <div className="section w-full">
          <Reveal className="flex items-end justify-between gap-4 mb-8 md:mb-12">
            <h2 className={cn('section-title', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? 'జనం ఇష్టపడేవి' : 'What people order'}
            </h2>
            <Link href="/menu" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 hover:text-brand-red transition-colors shrink-0">
              {language === 'te' ? 'మెను' : 'Full menu'} <ArrowUpRightIcon size={16} />
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(signature.length ? signature : [null, null, null]).map((d: any, i: number) => (
              <Reveal key={d?.id ?? i} delay={i * 0.12}>
                <Link href="/menu" className="group block">
                  <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden shadow-card">
                    {d ? (
                      <Image src={d.image || cardImage(d.id)} alt={d.name} fill sizes="(max-width:640px) 90vw, 30vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 skeleton" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                    {d && (
                      <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3">
                        <div>
                          <h3 className={cn('text-white font-semibold leading-tight text-xl', language === 'te' ? 'font-telugu' : 'font-display')}>
                            {language === 'te' ? d.nameTe : d.name}
                          </h3>
                          <p className="text-white/75 text-sm mt-0.5">{formatCurrency(d.variants?.[0]?.price ?? 0)}</p>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white transition-colors group-hover:bg-brand-red shrink-0">
                          <ArrowUpRightIcon size={18} />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────── 04 · SUNDAY ───────── */}
      {sunday && (
        <Section className="md:!min-h-[90svh]">
          <div className="section w-full">
            <Reveal>
              <div className="relative overflow-hidden rounded-[2rem] bg-brand-red text-white grid lg:grid-cols-2 gap-8 items-center p-7 md:p-12">
                <span aria-hidden className="font-telugu pointer-events-none select-none absolute -left-4 -top-12 text-[24vw] leading-none text-white/[0.06]">ఆది</span>
                <div className="relative">
                  <span className="eyebrow text-brand-gold"><StarIcon filled size={14} /> {language === 'te' ? 'ఆదివారం స్పెషల్' : 'Sunday Special'}</span>
                  <h2 className={cn('mt-4 font-display font-bold leading-[0.98] text-[clamp(2rem,5vw,3.6rem)]', language === 'te' ? 'font-telugu leading-tight' : '')}>
                    {language === 'te' ? sunday.menuItem?.nameTe : sunday.menuItem?.name}
                  </h2>
                  <p className={cn('mt-4 text-white/75 max-w-[42ch] leading-relaxed', language === 'te' ? 'font-telugu' : '')}>
                    {language === 'te' ? sunday.menuItem?.descriptionTe : sunday.menuItem?.description}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="text-3xl font-bold text-brand-gold font-display">{formatCurrency(sunday.specialPrice)}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80 border border-white/30 px-3 py-1.5 rounded-full">{language === 'te' ? 'ఆదివారం మాత్రమే' : 'This Sunday only'}</span>
                  </div>
                  <Link href="/sunday-special" className="mt-7 inline-flex items-center gap-2 btn-brand bg-white text-brand-red hover:bg-brand-gold hover:text-[#3A2A0E] px-7 py-3.5 text-base">
                    {language === 'te' ? 'చూడండి' : 'See this week'} <ArrowRightIcon size={18} />
                  </Link>
                </div>
                <div className="relative aspect-[5/4] rounded-[1.5rem] overflow-hidden shadow-float rotate-[1.5deg]">
                  <Image src={sunday.menuItem?.image || FOOD.sunday} alt={sunday.menuItem?.name ?? 'Sunday Special'} fill sizes="(max-width:1024px) 80vw, 480px" className="object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </Section>
      )}

      {/* ───────── 05 · WHY ───────── */}
      <Section>
        <div className="section w-full">
          <Reveal className="max-w-2xl mb-10 md:mb-14">
            <h2 className={cn('section-title', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? 'ఎందుకు మల్లన్నపేట' : 'Why Mallannapeta'}
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 md:divide-x divide-border">
            {[
              { Icon: FlameIcon, en: 'Cooked fresh, daily', te: 'రోజూ తాజాగా', dEn: 'New batches every morning. Never reheated, never from yesterday.', dTe: 'ప్రతి ఉదయం తాజా వంట.' },
              { Icon: ClockIcon, en: 'Hot in 30-45 min', te: '30-45 నిమిషాల్లో', dEn: 'Packed with care and delivered hot, straight to your door.', dTe: 'వేడిగా మీ ఇంటికే.' },
              { Icon: LeafIcon, en: 'Clean & hygienic', te: 'పరిశుభ్రం', dEn: 'Strict hygiene, every order packed safely.', dTe: 'కఠిన పరిశుభ్రత.' },
            ].map(({ Icon, en, te, dEn, dTe }, i) => (
              <Reveal key={i} delay={i * 0.1} className="md:px-8 first:md:pl-0 py-6 md:py-0">
                <Icon size={26} className="text-brand-red" />
                <h3 className={cn('mt-4 text-lg font-semibold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>{language === 'te' ? te : en}</h3>
                <p className={cn('mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[34ch]', language === 'te' ? 'font-telugu' : '')}>{language === 'te' ? dTe : dEn}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-12 flex items-center gap-2 text-sm text-muted-foreground">
            <PinIcon size={16} className="text-brand-red" /> {language === 'te' ? 'జగిత్యాల, తెలంగాణ' : 'Jagtial, Telangana'}
          </Reveal>
        </div>
      </Section>

      {/* ───────── 06 · CTA ───────── */}
      <Section className="md:!min-h-screen">
        <div className="section text-center">
          <BiryaniFinale />
          <Reveal>
            <h2 className={cn('mt-2 font-display font-bold text-foreground tracking-tight leading-[1] text-[clamp(2.2rem,9vw,6rem)] break-words', language === 'te' ? 'font-telugu leading-tight' : '')}>
              {language === 'te' ? 'ఆకలేస్తోందా?' : 'Hungry now?'}
            </h2>
            <p className={cn('mt-5 text-lg text-foreground/60 max-w-md mx-auto', language === 'te' ? 'font-telugu' : '')}>
              {language === 'te' ? 'మెను చూసి ఆర్డర్ చేయండి. 30-45 నిమిషాల్లో మీ ఇంటికే.' : 'Browse the menu and order. At your door in 30-45 minutes.'}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/menu" className="btn-brand px-9 py-4 text-base justify-center">
                {language === 'te' ? 'మెను చూడండి' : 'See the menu'} <ArrowRightIcon size={18} />
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  )
}
