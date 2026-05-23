'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        brand:
          'bg-brand-red text-white hover:bg-brand-red-dark hover:-translate-y-0.5 hover:shadow-brand active:translate-y-0 active:scale-[0.98] shadow-brand-sm',
        accent:
          'bg-brand-saffron text-white hover:bg-brand-saffron-light hover:-translate-y-0.5 hover:shadow-warm active:translate-y-0',
        outline:
          'border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white hover:-translate-y-0.5 hover:shadow-brand active:translate-y-0 active:scale-[0.98]',
        ghost:
          'text-foreground hover:bg-muted active:scale-[0.97]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
        link:
          'text-brand-red underline-offset-4 hover:underline p-0 h-auto shadow-none',
        gold:
          'bg-brand-gold text-amber-900 font-bold hover:bg-brand-gold-light hover:-translate-y-0.5 hover:shadow-warm active:translate-y-0 shadow-warm',
      },
      size: {
        sm:   'px-4 py-2 text-xs',
        md:   'px-5 py-2.5',
        lg:   'px-7 py-3.5 text-base',
        xl:   'px-8 py-4 text-base',
        icon: 'p-2.5 w-10 h-10',
        'icon-lg': 'p-3 w-12 h-12',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconRight, children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      whileTap={disabled || loading ? {} : { scale: 0.96 }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </motion.button>
  )
)
Button.displayName = 'Button'
