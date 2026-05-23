import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'veg' | 'nonveg' | 'bestseller' | 'sunday' | 'success' | 'warning' | 'error'
  className?: string
}

const variantClasses = {
  default: 'bg-muted text-muted-foreground',
  veg: 'bg-green-50 text-green-700 border border-green-200',
  nonveg: 'bg-red-50 text-red-700 border border-red-200',
  bestseller: 'bg-brand-gold/20 text-amber-800 border border-brand-gold/40',
  sunday: 'bg-brand-saffron/15 text-brand-saffron border border-brand-saffron/30',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
