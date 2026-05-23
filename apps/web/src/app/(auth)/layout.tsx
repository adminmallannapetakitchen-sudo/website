import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero-gradient flex">
      {/* Left panel — brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-brand-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 text-center text-white space-y-6">
          <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white/30 mx-auto shadow-brand-lg">
            <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="144px" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Mallannapeta Kitchen</h1>
            <p className="font-telugu text-xl mt-1 text-white/80">మల్లన్నపేట కిచెన్</p>
            <p className="text-white/70 mt-3 text-sm leading-relaxed max-w-xs mx-auto">
              Taste of Telangana — village-style home-cooked meals from a Jagtial kitchen, delivered fresh.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/60">
            <p>🌶️ Slow-cooked, village style</p>
            <p>🕐 30-45 min delivery</p>
            <p>💚 Fresh every day, from Jagtial</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brand-red/30">
                <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <p className="font-bold text-foreground font-display">Mallannapeta Kitchen</p>
                <p className="font-telugu text-xs text-muted-foreground">మల్లన్నపేట కిచెన్</p>
              </div>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
