import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { FloatingCartBar } from '@/components/shared/floating-cart-bar'
import { InstallPrompt } from '@/components/shared/install-prompt'
import { SwrFallback } from '@/components/providers/swr-fallback'
import { getPublicFallback } from '@/lib/server-api'

// Re-render (ISR) at most every 2 min; the seeded menu/kitchen data is cached
// at the edge so public pages arrive fully populated.
export const revalidate = 120

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const fallback = await getPublicFallback()
  return (
    <SwrFallback fallback={fallback}>
      <div className="flex flex-col min-h-screen paper-grain">
        <Header />
        <main className="flex-1 pt-16 md:pt-18 pb-nav">
          {children}
        </main>
        <Footer />
        <FloatingCartBar />
        <BottomNav />
        <InstallPrompt />
      </div>
    </SwrFallback>
  )
}
