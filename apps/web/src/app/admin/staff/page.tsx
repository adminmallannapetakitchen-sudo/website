'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Search, ShieldCheck, Mail, Phone } from 'lucide-react'
import { useAdminUsers } from '@/lib/hooks'
import { updateUserRole, assignUserStaffRole } from '@/lib/admin-actions'
import { swrFetcher } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ROLES = ['CUSTOMER', 'KITCHEN_STAFF', 'MANAGER', 'OWNER'] as const

const ROLE_STYLE: Record<string, string> = {
  OWNER: 'bg-brand-red/10 text-brand-red',
  MANAGER: 'bg-purple-50 text-purple-600',
  KITCHEN_STAFF: 'bg-amber-50 text-amber-600',
  CUSTOMER: 'bg-muted text-muted-foreground',
}

export default function AdminStaffPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const { users, isLoading, mutate } = useAdminUsers(search, roleFilter)
  const { data: roles } = useSWR<any[]>('/admin/roles', swrFetcher)
  const me = useAuthStore((s) => s.user)
  const [savingId, setSavingId] = useState<string | null>(null)

  const changeRole = async (id: string, role: string) => {
    setSavingId(id)
    try {
      await updateUserRole(id, role)
      await mutate()
      toast.success(`Role updated to ${role.replace(/_/g, ' ')}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update role')
    } finally {
      setSavingId(null)
    }
  }

  const changeStaffRole = async (id: string, staffRoleId: string) => {
    setSavingId(id)
    try {
      await assignUserStaffRole(id, staffRoleId || null)
      await mutate()
      toast.success(staffRoleId ? 'Custom role assigned' : 'Custom role removed')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not assign role')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-red" /> Staff & Roles
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Promote customers to staff. Role changes log the user out so the new permissions apply on next login.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone…"
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
        </div>
        <div className="flex gap-1.5">
          {['ALL', ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                roleFilter === r ? 'bg-brand-red text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {r === 'ALL' ? 'All' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No users found.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Current</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Set Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Custom Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const isSelf = u.id === me?.id
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">
                      {u.name ?? 'Unnamed'}
                      {isSelf && <span className="ml-2 text-[10px] text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {u.email && (
                        <span className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" />{u.email}</span>
                      )}
                      {u.phoneE164 && (
                        <span className="flex items-center gap-1 text-xs mt-0.5"><Phone className="w-3 h-3" />{u.phoneE164}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u._count?.orders ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', ROLE_STYLE[u.role])}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={savingId === u.id || isSelf}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="border border-input rounded-lg px-2 py-1.5 text-xs bg-card disabled:opacity-50"
                        title={isSelf ? 'You cannot change your own role' : undefined}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.staffRoleId ?? ''}
                        disabled={savingId === u.id}
                        onChange={(e) => changeStaffRole(u.id, e.target.value)}
                        className="border border-input rounded-lg px-2 py-1.5 text-xs bg-card disabled:opacity-50"
                        title="A custom role overrides the built-in role's access"
                      >
                        <option value="">— None —</option>
                        {(roles ?? []).map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </motion.div>
  )
}
