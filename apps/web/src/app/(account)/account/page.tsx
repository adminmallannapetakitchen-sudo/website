'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, MapPin, Bell, Lock, Plus, Trash2,
  Package, LogIn, Save, BellRing, BellOff, LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { useProfile, useAddresses } from '@/lib/hooks'
import { api } from '@/lib/api-client'
import { logout, requestAttachPhoneOtp, verifyAttachPhoneOtp } from '@/lib/auth-actions'
import { enablePush, disablePush, getPushState } from '@/lib/push'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AccountPage() {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const { profile, mutate: mutateProfile } = useProfile()
  const { addresses, mutate: mutateAddr } = useAddresses()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingName, setSavingName] = useState(false)
  // Phone change (OTP-verified)
  const [phoneEdit, setPhoneEdit] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneBusy, setPhoneBusy] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [prefs, setPrefs] = useState({ orderUpdates: true, sundaySpecialAlerts: true, marketing: false })
  const [pushState, setPushState] = useState<string>('unsupported')
  const [pushBusy, setPushBusy] = useState(false)
  const [showAddr, setShowAddr] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', city: 'Jagtial', pincode: '505327' })

  useEffect(() => {
    if (hasHydrated && !user) router.replace('/login')
  }, [hasHydrated, user, router])

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setEmail(profile.email ?? '')
      if (profile.notificationPreferences) setPrefs(profile.notificationPreferences)
    }
  }, [profile])

  useEffect(() => {
    getPushState().then(setPushState)
  }, [])

  if (!hasHydrated || !user) {
    return (
      <div className="section py-20 text-center text-muted-foreground">
        {!hasHydrated ? 'Loading…' : (
          <div className="space-y-4">
            <Lock className="w-11 h-11 mx-auto text-brand-red" strokeWidth={1.5} />
            <p>Please log in to view your account.</p>
            <Link href="/login"><Button icon={<LogIn className="w-4 h-4" />}>Log in</Button></Link>
          </div>
        )}
      </div>
    )
  }

  const saveProfile = async () => {
    setSavingName(true)
    try {
      await api.patch('/me', { name, email: email.trim() || undefined })
      await mutateProfile()
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e?.message ?? 'Update failed')
    } finally {
      setSavingName(false)
    }
  }

  const sendPhoneOtp = async () => {
    const p = newPhone.replace(/[\s-]/g, '')
    if (!/^(\+?91)?[6-9]\d{9}$/.test(p)) return toast.error('Enter a valid 10-digit mobile number')
    setPhoneBusy(true)
    try {
      await requestAttachPhoneOtp(p)
      setPhoneOtpSent(true)
      toast.success('OTP sent to your new number')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not send OTP')
    } finally {
      setPhoneBusy(false)
    }
  }

  const verifyPhone = async () => {
    if (!phoneOtp.trim()) return toast.error('Enter the OTP')
    setPhoneBusy(true)
    try {
      await verifyAttachPhoneOtp(newPhone.replace(/[\s-]/g, ''), phoneOtp.trim())
      await mutateProfile()
      setPhoneEdit(false)
      setPhoneOtpSent(false)
      setPhoneOtp('')
      setNewPhone('')
      toast.success('Phone number updated')
    } catch (e: any) {
      toast.error(e?.message ?? 'Invalid OTP')
    } finally {
      setPhoneBusy(false)
    }
  }

  const hasPassword = !!profile?.hasPassword

  const changePassword = async () => {
    if (pw.next.length < 8) return toast.error('New password must be at least 8 characters')
    if (hasPassword && !pw.current) return toast.error('Enter your current password')
    setSavingPw(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: hasPassword ? pw.current : undefined,
        newPassword: pw.next,
      })
      setPw({ current: '', next: '' })
      await mutateProfile()
      toast.success(hasPassword ? 'Password changed' : 'Password set')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save password')
    } finally {
      setSavingPw(false)
    }
  }

  const updatePref = async (key: keyof typeof prefs, val: boolean) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    try {
      await api.patch('/me/notification-preferences', { [key]: val })
    } catch (e: any) {
      toast.error('Could not save preference')
      setPrefs(prefs)
    }
  }

  const togglePush = async () => {
    setPushBusy(true)
    try {
      if (pushState === 'subscribed') {
        await disablePush()
        toast.success('Push notifications disabled')
      } else {
        await enablePush()
        toast.success('Push notifications enabled')
      }
      setPushState(await getPushState())
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not change push setting')
    } finally {
      setPushBusy(false)
    }
  }

  const addAddress = async () => {
    if (!newAddr.line1 || !newAddr.pincode) return toast.error('Fill address and pincode')
    try {
      await api.post('/me/addresses', { ...newAddr })
      await mutateAddr()
      setShowAddr(false)
      setNewAddr({ label: 'Home', line1: '', city: 'Jagtial', pincode: '505327' })
      toast.success('Address added')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not add address')
    }
  }

  const deleteAddress = async (id: string) => {
    try {
      await api.delete(`/me/addresses/${id}`)
      await mutateAddr()
      toast.success('Address removed')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not remove address')
    }
  }

  return (
    <div className="section py-8 md:py-12 max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.role !== 'CUSTOMER' ? `${user.role} account` : 'Customer account'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/account/orders">
            <Button variant="outline" size="sm" icon={<Package className="w-4 h-4" />}>My Orders</Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="!text-red-600 !border-red-200 hover:!bg-red-50"
            icon={<LogOut className="w-4 h-4" />}
            onClick={async () => { await logout(); router.push('/'); router.refresh() }}
          >
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><User className="w-5 h-5 text-brand-red" /> Profile</h2>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={<User className="w-4 h-4" />} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="w-4 h-4" />} placeholder="you@example.com" />
        <Button onClick={saveProfile} loading={savingName} size="sm" icon={<Save className="w-4 h-4" />}>Save</Button>

        {/* Phone — change requires OTP verification */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm flex items-center gap-2 text-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{profile?.phone ?? 'No phone added'}</span>
            </p>
            {!phoneEdit && (
              <Button variant="outline" size="sm" onClick={() => setPhoneEdit(true)}>
                {profile?.phone ? 'Change' : 'Add phone'}
              </Button>
            )}
          </div>

          {phoneEdit && (
            <div className="mt-3 space-y-2 bg-muted/40 rounded-xl p-3">
              {!phoneOtpSent ? (
                <>
                  <Input label="New mobile number" inputMode="numeric" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10-digit number" icon={<Phone className="w-4 h-4" />} />
                  <div className="flex gap-2">
                    <Button size="sm" loading={phoneBusy} onClick={sendPhoneOtp}>Send OTP</Button>
                    <Button size="sm" variant="outline" onClick={() => { setPhoneEdit(false); setNewPhone('') }}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <Input label={`Enter the OTP sent to ${newPhone}`} inputMode="numeric" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="OTP" />
                  <div className="flex gap-2">
                    <Button size="sm" loading={phoneBusy} onClick={verifyPhone}>Verify & save</Button>
                    <Button size="sm" variant="outline" onClick={() => setPhoneOtpSent(false)}>Back</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Addresses */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-red" /> Addresses</h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddr(!showAddr)} icon={<Plus className="w-4 h-4" />}>Add</Button>
        </div>
        {addresses.map((a: any) => (
          <div key={a.id} className="flex items-start justify-between border border-border rounded-xl p-3">
            <div>
              <p className="text-sm font-semibold">{a.label}{a.isDefault && <span className="ml-2 text-[10px] text-brand-red">default</span>}</p>
              <p className="text-sm text-muted-foreground">{a.line1}</p>
              <p className="text-sm text-muted-foreground">{a.city}, {a.pincode}</p>
            </div>
            <button onClick={() => deleteAddress(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {addresses.length === 0 && !showAddr && <p className="text-sm text-muted-foreground">No saved addresses.</p>}
        {showAddr && (
          <div className="border-2 border-dashed border-border rounded-xl p-3 space-y-2">
            <Input label="Label" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
            <Input label="Address line" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
            <div className="flex gap-2">
              <Input label="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              <Input label="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
            </div>
            <Button size="sm" onClick={addAddress}>Save address</Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><Bell className="w-5 h-5 text-brand-red" /> Notifications</h2>

        <button
          onClick={togglePush}
          disabled={pushBusy || pushState === 'unsupported' || pushState === 'denied'}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 disabled:opacity-60"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {pushState === 'subscribed' ? <BellRing className="w-4 h-4 text-green-600" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            Browser push notifications
          </span>
          <span className="text-xs text-muted-foreground">
            {pushState === 'subscribed' ? 'On — tap to disable'
              : pushState === 'denied' ? 'Blocked in browser'
              : pushState === 'unsupported' ? 'Not supported'
              : 'Off — tap to enable'}
          </span>
        </button>

        {[
          { key: 'orderUpdates' as const, label: 'Order status updates' },
          { key: 'sundaySpecialAlerts' as const, label: 'Sunday Special alerts' },
          { key: 'marketing' as const, label: 'Offers & promotions' },
        ].map((p) => (
          <label key={p.key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{p.label}</span>
            <input
              type="checkbox"
              checked={prefs[p.key]}
              onChange={(e) => updatePref(p.key, e.target.checked)}
              className="w-9 h-5 appearance-none rounded-full bg-muted checked:bg-brand-red relative transition-colors cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition-transform checked:before:translate-x-4"
            />
          </label>
        ))}
      </div>

      {/* Password — change if one exists, or set one for Google/phone accounts */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-red" /> {hasPassword ? 'Change Password' : 'Set a Password'}
        </h2>
        {!hasPassword && (
          <p className="text-xs text-muted-foreground -mt-2">
            You signed in with Google/phone. Set a password to also log in with your email.
          </p>
        )}
        {hasPassword && (
          <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} icon={<Lock className="w-4 h-4" />} />
        )}
        <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} icon={<Lock className="w-4 h-4" />} />
        <Button onClick={changePassword} loading={savingPw} size="sm">{hasPassword ? 'Update Password' : 'Set Password'}</Button>
      </div>

      <Button
        variant="outline"
        className="w-full !text-red-600 !border-red-200 hover:!bg-red-50"
        onClick={async () => { await logout(); router.push('/'); router.refresh() }}
      >
        Log out
      </Button>
    </div>
  )
}
