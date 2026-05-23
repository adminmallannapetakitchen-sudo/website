'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Mail, Phone, ShoppingBag } from 'lucide-react'
import useSWR from 'swr'
import { swrFetcher } from '@/lib/api-client'

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  const { data, isLoading } = useSWR<any>(`/admin/reports/customers${q}`, swrFetcher)
  const customers = data?.customers ?? []

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} registered customers</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No customers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{c.name ?? 'Guest'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {c.email && (
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="w-3 h-3" />{c.email}
                      </span>
                    )}
                    {c.phoneE164 && (
                      <span className="flex items-center gap-1 text-xs mt-0.5">
                        <Phone className="w-3 h-3" />{c.phoneE164}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-red" />
                      {c._count?.orders ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}
