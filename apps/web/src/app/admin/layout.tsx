'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Tag,
  Sparkles,
  MapPin,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  Bell,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useKitchenSettings } from '@/lib/hooks'
import { logout } from '@/lib/auth-actions'

type StaffRole = 'OWNER' | 'MANAGER' | 'KITCHEN_STAFF'
const ALL_STAFF: StaffRole[] = ['OWNER', 'MANAGER', 'KITCHEN_STAFF']
const MGMT: StaffRole[] = ['OWNER', 'MANAGER']

const navItems: {
  href: string
  icon: any
  label: string
  exact?: boolean
  roles: StaffRole[]
}[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, roles: ALL_STAFF },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders', roles: ALL_STAFF },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menu', roles: MGMT },
  { href: '/admin/categories', icon: Tag, label: 'Categories', roles: MGMT },
  { href: '/admin/sunday-specials', icon: Sparkles, label: 'Sunday Specials', roles: MGMT },
  { href: '/admin/coupons', icon: Tag, label: 'Coupons', roles: MGMT },
  { href: '/admin/customers', icon: Users, label: 'Customers', roles: MGMT },
  { href: '/admin/pincodes', icon: MapPin, label: 'Pincodes', roles: MGMT },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports', roles: MGMT },
  { href: '/admin/staff', icon: ShieldCheck, label: 'Staff', roles: ['OWNER'] },
  { href: '/admin/settings', icon: Settings, label: 'Settings', roles: MGMT },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, accessToken, hasHydrated } = useAuthStore()
  const { settings: kitchenSettings } = useKitchenSettings()
  const kitchenOpen = kitchenSettings ? !!kitchenSettings.isOpen : false

  // Auth gate — only staff roles may access /admin
  const isAdmin =
    !!accessToken &&
    !!user &&
    (user.role === 'OWNER' || user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF')

  // Only redirect AFTER the persisted store has rehydrated from localStorage,
  // otherwise a logged-in admin gets bounced on first paint.
  useEffect(() => {
    if (hasHydrated && !isAdmin) router.replace('/login')
  }, [hasHydrated, isAdmin, router])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <p className="text-muted-foreground text-sm">Admin access required.</p>
          <Link href="/login" className="text-brand-red text-sm font-medium hover:underline">
            Go to login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-foreground text-white flex flex-col transition-transform duration-300',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 p-5 border-b border-white/10">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-brand-red/40">
              <Image src="/logo.jpeg" alt="Logo" fill className="object-cover" sizes="36px" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Mallannapeta</p>
              <p className="text-white/50 text-xs">Admin Panel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1 rounded hover:bg-white/10 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {navItems
              .filter((item) => user && item.roles.includes(user.role as StaffRole))
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive(item.href, item.exact)
                    ? 'bg-brand-red text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive(item.href, item.exact) && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold flex-shrink-0 uppercase">
                {(user?.name ?? user?.email ?? 'A')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {user?.name ?? user?.role ?? 'Admin'}
                </p>
                <p className="text-white/50 text-xs truncate">{user?.email ?? user?.phone}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      </>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 flex-shrink-0 bg-background">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Kitchen status — reflects the real open/closed state */}
          <Link href="/admin/settings" className="flex items-center gap-2 text-sm" title="Kitchen status (open/close in Settings)">
            <span className="relative flex h-2 w-2">
              {kitchenOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  kitchenOpen ? 'bg-green-500' : 'bg-red-500',
                )}
              />
            </span>
            <span
              className={cn(
                'font-medium text-xs hidden sm:inline',
                kitchenOpen ? 'text-green-700' : 'text-red-600',
              )}
            >
              {kitchenOpen ? 'Kitchen Open' : 'Kitchen Closed'}
            </span>
          </Link>

          <button className="relative p-2 rounded-lg hover:bg-muted">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />
          </button>

          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            ← View Site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
