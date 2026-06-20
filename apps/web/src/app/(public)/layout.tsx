import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { FloatingCartBar } from '@/components/shared/floating-cart-bar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen paper-grain">
      <Header />
      <main className="flex-1 pt-16 md:pt-18 pb-nav">
        {children}
      </main>
      <Footer />
      <FloatingCartBar />
      <BottomNav />
    </div>
  )
}
