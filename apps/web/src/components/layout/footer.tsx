'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Phone, Mail, Sparkles } from 'lucide-react'
import { useLanguageStore } from '@/store/language-store'
import { kitchenInfo } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { JagtialBorder } from '@/components/shared/motifs'
import { replayIntro } from '@/components/shared/curtain-riser'

export function Footer() {
  const { t, language } = useLanguageStore()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-white/80 mt-auto relative">
      {/* Top folk-border accent */}
      <div className="text-brand-gold/40">
        <JagtialBorder className="w-full h-4" />
      </div>

      <div className="section py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold/40">
                <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <p
                  className={cn(
                    'font-bold text-white text-base leading-tight',
                    language === 'te' ? 'font-telugu' : 'font-display'
                  )}
                >
                  {language === 'te' ? 'మల్లన్నపేట కిచెన్' : 'Mallannapeta Kitchen'}
                </p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-brand-gold/80 font-semibold mt-0.5">
                  Jagtial · Telangana
                </p>
              </div>
            </div>
            <p className={cn('text-sm leading-relaxed', language === 'te' ? 'font-telugu' : '')}>
              {t.footer.tagline}
            </p>
            <div className="flex gap-3">
              <a
                href={kitchenInfo.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`tel:${kitchenInfo.phone}`}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Phone"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${kitchenInfo.email}`}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">
              {language === 'te' ? 'శీఘ్ర లింకులు' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/menu', label: t.footer.links.menu },
                { href: '/sunday-special', label: t.nav.sundaySpecial },
                { href: '/login', label: t.nav.login },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'text-sm hover:text-white transition-colors',
                      language === 'te' ? 'font-telugu' : ''
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={replayIntro}
                  className="text-sm text-brand-gold/80 hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className={language === 'te' ? 'font-telugu' : ''}>
                    {language === 'te' ? 'ఇంట్రో మళ్లీ ఆడించు' : 'Replay intro'}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">
              {t.footer.callUs}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`tel:${kitchenInfo.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {kitchenInfo.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${kitchenInfo.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {kitchenInfo.email}
                </a>
              </li>
              <li className={cn(language === 'te' ? 'font-telugu' : '')}>
                {language === 'te' ? kitchenInfo.openingHoursTe : kitchenInfo.openingHours}
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Legal</h3>
            <ul className="space-y-2">
              {[
                { href: '/privacy', label: t.footer.links.privacy },
                { href: '/terms', label: t.footer.links.terms },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn('text-sm hover:text-white transition-colors',
                      language === 'te' ? 'font-telugu' : '')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} Mallannapeta Kitchen. {t.footer.rights}</p>
          <p className="flex items-center gap-1.5">
            <span>Made by</span>
            <a
              href="https://igniks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/75 hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              igniks
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
