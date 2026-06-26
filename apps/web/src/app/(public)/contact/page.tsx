import type { Metadata } from 'next'
import { Phone, Mail, MessageCircle, Instagram, Clock, MapPin } from 'lucide-react'
import { kitchenInfo } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Contact Us · Mallannapeta Kitchen',
  description: 'Get in touch with Mallannapeta Kitchen — phone, WhatsApp, email and hours.',
}

const rows = [
  { icon: Phone, label: 'Phone', value: kitchenInfo.phone, href: `tel:${kitchenInfo.phone}` },
  { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', href: kitchenInfo.whatsapp },
  { icon: Mail, label: 'Email', value: kitchenInfo.email, href: `mailto:${kitchenInfo.email}` },
  { icon: Instagram, label: 'Instagram', value: '@Mallanapeta_kitchen', href: kitchenInfo.instagram },
]

export default function ContactPage() {
  return (
    <div className="section py-12 md:py-16">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">Contact Us</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          We’d love to hear from you — whether it’s a question about your order, feedback on a dish,
          or help with the website.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-8">
          {rows.map((r) => (
            <a
              key={r.label}
              href={r.href}
              target={r.href.startsWith('http') ? '_blank' : undefined}
              rel={r.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform"
            >
              <span className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center flex-shrink-0">
                <r.icon className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{r.label}</span>
                <span className="block text-sm font-medium text-foreground truncate">{r.value}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-3 text-[15px] text-muted-foreground">
          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-red flex-shrink-0" /> {kitchenInfo.openingHours} (daily)
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" /> Mallannapeta Kitchen, Jagtial,
            Telangana, India.
          </p>
          <p>For order issues, please keep your order number handy — it helps us help you faster.</p>
        </div>
      </div>
    </div>
  )
}
