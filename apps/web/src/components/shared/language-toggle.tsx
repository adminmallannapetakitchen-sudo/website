'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  className?: string
  compact?: boolean
}

export function LanguageToggle({ className, compact }: LanguageToggleProps) {
  const { language, toggle } = useLanguageStore()
  const isTe = language === 'te'

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.93 }}
      title={isTe ? 'Switch to English' : 'తెలుగులో చూడండి'}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full overflow-hidden',
        'border-2 border-brand-red/25 bg-brand-red/6',
        'hover:border-brand-red/50 hover:bg-brand-red/12 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red',
        compact ? 'px-2.5 py-1' : 'px-3.5 py-1.5',
        className
      )}
    >
      {/* Sliding background pill */}
      <motion.span
        layout
        className="absolute inset-0 bg-brand-red/10 rounded-full"
        initial={false}
      />

      <AnimatePresence mode="wait">
        <motion.span
          key={language}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.14 }}
          className={cn(
            'relative z-10 font-bold leading-none text-brand-red',
            compact ? 'text-[11px]' : 'text-xs',
            isTe ? '' : 'font-telugu'
          )}
        >
          {isTe ? 'EN' : 'తె'}
        </motion.span>
      </AnimatePresence>

      <span className={cn(
        'relative z-10 text-brand-red/70 font-medium leading-none',
        compact ? 'text-[10px]' : 'text-xs',
        isTe ? '' : 'font-telugu'
      )}>
        {isTe ? 'English' : 'తెలుగు'}
      </span>
    </motion.button>
  )
}
