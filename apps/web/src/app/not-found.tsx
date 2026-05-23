'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center">
        <div className="text-center py-20 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-8xl"
            >
              🍛
            </motion.div>
            <div>
              <h1 className="text-6xl font-bold text-brand-red font-display">404</h1>
              <h2 className="text-xl font-semibold text-foreground mt-2">Page Not Found</h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Looks like this page ran off with the food. Let's get you back on track.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button icon={<Home className="w-4 h-4" />}>Back to Home</Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" icon={<Search className="w-4 h-4" />}>Browse Menu</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
