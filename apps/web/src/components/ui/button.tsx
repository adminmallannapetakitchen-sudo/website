'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-sm [transition:transform_0.18s_var(--ease-out),background-color_0.18s_var(--ease-out),box-shadow_0.18s_var(--ease-out),color_0.18s_var(--ease-out),border-color_0.18s_var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        brand:
          'bg-brand-red text-white shadow-brand-sm hover:bg-brand-red-dark hover:shadow-brand',
        accent:
          'bg-brand-saffron text-white shadow-warm hover:bg-brand-saffron-light',
        outline:
          'border border-brand-red/35 text-brand-red hover:bg-brand-red hover:text-white hover:border-brand-red',
        ghost:
          'text-foreground hover:bg-muted',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        link:
          'text-brand-red underline-offset-4 hover:underline p-0 h-auto shadow-none',
        gold:
          'bg-brand-gold text-[#3A2A0E] font-bold shadow-warm hover:bg-brand-gold-light',
      },
      size: {
        sm:   'px-4 py-2 text-xs',
        md:   'px-5 py-2.5',
        lg:   'px-7 py-3.5 text-base',
        xl:   'px-9 py-4 text-base',
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
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
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
