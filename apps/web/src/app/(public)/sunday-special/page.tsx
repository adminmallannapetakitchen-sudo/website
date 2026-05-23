'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Bell, Clock, Zap, ArrowRight } from 'lucide-react'
import { MenuCard } from '@/components/menu/menu-card'
import Link from 'next/link'
import { useLanguageStore } from '@/store/language-store'
import { useCartStore } from '@/store/cart-store'
import { useSundaySpecial, useMenu } from '@/lib/hooks'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function CountdownTimer({ target }: { target: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff > 0) {
        setT({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        })
      } else {
        setT({ d: 0, h: 0, m: 0, s: 0 })
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  const units = [
    { val: t.d, label: 'days' },
    { val: t.h, label: 'hr' },
    { val: t.m, label: 'min' },
    { val: t.s, label: 'sec' },
  ]

  return (
    <div className="flex items-center justify-center gap-2">
      {units.map((unit, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[56px] text-center">
            <motion.span
              key={unit.val}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold text-white block tabular-nums"
            >
              {String(unit.val).padStart(2, '0')}
            </motion.span>
            <span className="text-white/70 text-xs">{unit.label}</span>
          </div>
          {i < units.length - 1 && <span className="text-white/70 text-xl font-bold">:</span>}
        </div>
      ))}
    </div>
  )
}

export default function SundaySpecialPage() {
  const { t, language } = useLanguageStore()
  const { addItem } = useCartStore()
  const { special, specials, isOrderable, orderOpensAt, isLoading } = useSundaySpecial()
  const { items } = useMenu()

  if (isLoading) {
    return (
      <div className="section py-20 text-center text-muted-foreground">
        <div className="animate-pulse text-5xl mb-4">🍲</div>
        Loading…
      </div>
    )
  }

  if (!special) {
    return (
      <div className="section py-20 text-center space-y-4">
        <div className="text-6xl">🗓️</div>
        <h1 className={cn('text-2xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
          {language === 'te' ? 'ఈ ఆదివారం స్పెషల్ ఇంకా ప్రకటించలేదు' : 'No Sunday Special active right now'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'te'
            ? 'ప్రతి ఆదివారం ఒక ప్రత్యేక వంటకం. మెను నుండి ఆర్డర్ చేయండి.'
            : 'A different traditional dish every Sunday. Check back, or order from the menu.'}
        </p>
        <Link href="/menu">
          <Button size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
            {language === 'te' ? 'మెను చూడండి' : 'Browse Menu'}
          </Button>
        </Link>
      </div>
    )
  }

  const item = special.menuItem

  const addSpecialToCart = (sp: any) => {
    if (!isOrderable) {
      toast.info('Sunday Special can only be ordered on Sunday — set a reminder!')
      return
    }
    const it = sp.menuItem
    if (!it?.variants?.[0]) {
      toast.error('This special is not orderable')
      return
    }
    addItem({
      id: `${it.id}-${it.variants[0].id}`,
      menuItemId: it.id,
      name: it.name,
      nameTe: it.nameTe,
      variantId: it.variants[0].id,
      variantLabel: it.variants[0].label,
      price: sp.specialPrice,
      isVeg: it.isVeg,
    })
    toast.success(`${it.name} added to cart at special price!`)
  }

  const handleOrderNow = () => addSpecialToCart(special)

  // Additional scheduled specials for the same Sunday (beyond the hero one).
  const moreSpecials = (specials ?? []).slice(1)
  const otherSpecials = items.filter(
    (i) => i.isSundaySpecial && !(specials ?? []).some((s: any) => s.menuItem?.id === i.id),
  )

  return (
    <div>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                left: `${i * 14}%`,
                top: `${(i % 3) * 30 + 10}%`,
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="section relative z-10 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white space-y-4"
          >
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-6 h-6 text-brand-gold animate-bounce-subtle" />
              <span
                className={cn('text-lg font-semibold', language === 'te' ? 'font-telugu' : '')}
              >
                {t.sundaySpecial.title}
              </span>
              <Sparkles className="w-6 h-6 text-brand-gold animate-bounce-subtle" />
            </div>
            <h1
              className={cn(
                'text-4xl md:text-5xl lg:text-6xl font-bold',
                language === 'te' ? 'font-telugu text-3xl md:text-4xl' : 'font-display'
              )}
            >
              {language === 'te' ? item.nameTe : item.name}
            </h1>
            <p
              className={cn(
                'text-white/80 text-base md:text-lg max-w-xl mx-auto',
                language === 'te' ? 'font-telugu' : ''
              )}
            >
              {language === 'te' ? item.descriptionTe : item.description}
            </p>

            {/* Price */}
            <div className="flex items-center gap-3 justify-center">
              <span className="text-4xl font-bold text-brand-gold">
                {formatCurrency(special.specialPrice)}
              </span>
              <div className="text-left">
                <span className="text-white/50 line-through text-lg block">
                  {formatCurrency(item.variants[0].price)}
                </span>
                <span className="text-brand-gold text-xs font-semibold">
                  Save {formatCurrency(item.variants[0].price - special.specialPrice)}
                </span>
              </div>
            </div>

            {!isOrderable && orderOpensAt && (
              <div className="space-y-3">
                <p className="text-white/80 text-sm flex items-center gap-2 justify-center">
                  <Clock className="w-4 h-4" />
                  {language === 'te' ? 'ఆర్డర్ ఆదివారం తెరుచుకుంటుంది' : 'Ordering opens Sunday in'}
                </p>
                <CountdownTimer target={orderOpensAt} />
              </div>
            )}

            {isOrderable && (
              <p className="inline-flex items-center gap-2 bg-green-500/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {language === 'te' ? 'ఇప్పుడు ఆర్డర్ చేయవచ్చు!' : 'Available to order now!'}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                variant="gold"
                size="lg"
                onClick={handleOrderNow}
                disabled={!isOrderable}
                icon={<Zap className="w-5 h-5" />}
                className={!isOrderable ? 'opacity-60 cursor-not-allowed' : ''}
              >
                <span className={language === 'te' ? 'font-telugu' : ''}>
                  {isOrderable
                    ? language === 'te' ? 'ఇప్పుడే ఆర్డర్ చేయండి' : 'Order Sunday Special'
                    : language === 'te' ? 'ఆదివారం మాత్రమే' : 'Available this Sunday'}
                </span>
              </Button>
              <Button
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                icon={<Bell className="w-5 h-5" />}
                onClick={() => toast.info('You\'ll be notified every Sunday morning!')}
              >
                <span className={language === 'te' ? 'font-telugu' : ''}>
                  {t.sundaySpecial.notifyMe}
                </span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How Sunday Special works */}
      <section className="section py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className={cn('text-2xl md:text-3xl font-bold text-foreground', language === 'te' ? 'font-telugu' : 'font-display')}>
            {language === 'te' ? 'ఇది ఎలా పని చేస్తుంది' : 'How Sunday Special Works'}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '🔔', title: 'Get Notified', titleTe: 'నోటిఫికేషన్ పొందండి', desc: 'Enable push notifications to get Sunday morning alerts.', descTe: 'ఆదివారం ఉదయం అలెర్ట్‌లు పొందడానికి పుష్ నోటిఫికేషన్లను ఎనేబుల్ చేయండి.' },
            { icon: '🍽️', title: 'Special Dish', titleTe: 'ప్రత్యేక వంటకం', desc: 'A different traditional dish every Sunday — only available that day.', descTe: 'ప్రతి ఆదివారం ఒక భిన్నమైన సంప్రదాయ వంటకం — ఆ రోజు మాత్రమే.' },
            { icon: '⚡', title: 'Special Price', titleTe: 'ప్రత్యేక ధర', desc: 'Sunday Specials are offered at a discounted price. Limited time only.', descTe: 'ఆదివారం స్పెషల్‌లు తక్కువ ధరలో అందిస్తారు. పరిమిత సమయం మాత్రమే.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="card p-5 text-center"
            >
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className={cn('font-semibold text-foreground mb-1', language === 'te' ? 'font-telugu' : '')}>
                {language === 'te' ? step.titleTe : step.title}
              </h3>
              <p className={cn('text-sm text-muted-foreground', language === 'te' ? 'font-telugu' : '')}>
                {language === 'te' ? step.descTe : step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* More scheduled specials for THIS Sunday */}
      {moreSpecials.length > 0 && (
        <section className="section pt-14">
          <h2 className={cn('text-xl md:text-2xl font-bold text-foreground mb-6', language === 'te' ? 'font-telugu' : 'font-display')}>
            {language === 'te' ? 'ఈ ఆదివారం మరిన్ని స్పెషల్స్' : 'More this Sunday'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {moreSpecials.map((sp: any) => {
              const it = sp.menuItem
              const base = it?.variants?.[0]?.price
              return (
                <div key={sp.id} className="card overflow-hidden flex flex-col">
                  <div className="relative h-40 bg-muted">
                    {it?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">🍲</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className={cn('font-semibold text-foreground', language === 'te' ? 'font-telugu' : '')}>
                      {language === 'te' ? it?.nameTe || it?.name : it?.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-brand-red">{formatCurrency(sp.specialPrice)}</span>
                      {typeof base === 'number' && base > sp.specialPrice && (
                        <span className="text-sm text-muted-foreground line-through">{formatCurrency(base)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className={cn('mt-3', !isOrderable && 'opacity-60 cursor-not-allowed')}
                      onClick={() => addSpecialToCart(sp)}
                      disabled={!isOrderable}
                    >
                      {isOrderable
                        ? language === 'te' ? 'ఆర్డర్ చేయండి' : 'Add to cart'
                        : language === 'te' ? 'ఆదివారం మాత్రమే' : 'Sunday only'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Other Sunday specials */}
      {otherSpecials.length > 0 && (
        <section className="section pb-14">
          <h2 className={cn('text-xl md:text-2xl font-bold text-foreground mb-6', language === 'te' ? 'font-telugu' : 'font-display')}>
            {language === 'te' ? 'ఇతర స్పెషల్ వంటలు' : 'Other Special Dishes'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherSpecials.map((item) => (
              <MenuCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
