'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { KeyRound, Plus, Trash2, Pencil, X, Lock, Check } from 'lucide-react'
import { swrFetcher } from '@/lib/api-client'
import { createStaffRole, updateStaffRole, deleteStaffRole } from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type PermMeta = { key: string; label: string; description: string; group: string }
type Role = { id: string; name: string; permissions: string[]; isSystem: boolean; _count?: { users: number } }

export default function AdminRolesPage() {
  const { data: catalog } = useSWR<PermMeta[]>('/admin/roles/catalog', swrFetcher)
  const { data: roles, isLoading, mutate } = useSWR<Role[]>('/admin/roles', swrFetcher)

  const [editing, setEditing] = useState<Role | 'new' | null>(null)

  const groups = Array.from(new Set((catalog ?? []).map((p) => p.group)))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-brand-red" /> Roles & Permissions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create a role, tick exactly what it can access, then assign it to staff on the Staff page.
          </p>
        </div>
        <Button onClick={() => setEditing('new')} icon={<Plus className="w-4 h-4" />}>
          New role
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(roles ?? []).map((role) => (
            <div key={role.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    {role.name}
                    {role.isSystem && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {role._count?.users ?? 0} {role._count?.users === 1 ? 'person' : 'people'} ·{' '}
                    {role.permissions.length} {role.permissions.length === 1 ? 'permission' : 'permissions'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(role)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-red hover:bg-muted"
                    title="Edit role"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete the "${role.name}" role?`)) return
                        try {
                          await deleteStaffRole(role.id)
                          await mutate()
                          toast.success('Role deleted')
                        } catch (e: any) {
                          toast.error(e?.message ?? 'Could not delete role')
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      title="Delete role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No access yet</span>
                ) : (
                  (catalog ?? [])
                    .filter((p) => role.permissions.includes(p.key))
                    .map((p) => (
                      <span key={p.key} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red">
                        {p.label}
                      </span>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <RoleEditor
          role={editing === 'new' ? null : editing}
          catalog={catalog ?? []}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await mutate()
          }}
        />
      )}
    </motion.div>
  )
}

function RoleEditor({
  role,
  catalog,
  groups,
  onClose,
  onSaved,
}: {
  role: Role | null
  catalog: PermMeta[]
  groups: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [perms, setPerms] = useState<string[]>(role?.permissions ?? [])
  const [saving, setSaving] = useState(false)

  const toggle = (key: string) =>
    setPerms((cur) => (cur.includes(key) ? cur.filter((p) => p !== key) : [...cur, key]))

  const save = async () => {
    if (!name.trim()) return toast.error('Give the role a name')
    setSaving(true)
    try {
      if (role) await updateStaffRole(role.id, { name: name.trim(), permissions: perms })
      else await createStaffRole({ name: name.trim(), permissions: perms })
      toast.success(role ? 'Role updated' : 'Role created')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{role ? 'Edit role' : 'New role'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <Input label="Role name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delivery, Order Manager" />

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">What can this role access?</p>
          {groups.map((group) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
              <div className="space-y-1.5">
                {catalog
                  .filter((p) => p.group === group)
                  .map((p) => {
                    const on = perms.includes(p.key)
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => toggle(p.key)}
                        className={cn(
                          'w-full flex items-start gap-3 text-left p-3 rounded-xl border transition-colors',
                          on ? 'border-brand-red bg-brand-red/5' : 'border-border hover:border-brand-red/40'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                            on ? 'border-brand-red bg-brand-red text-white' : 'border-border'
                          )}
                        >
                          {on && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{p.label}</span>
                          <span className="block text-xs text-muted-foreground">{p.description}</span>
                        </span>
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={save} loading={saving} className="flex-1">
            {role ? 'Save changes' : 'Create role'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
