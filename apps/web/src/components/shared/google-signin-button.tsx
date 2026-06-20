'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { toast } from 'sonner'
import { loginWithGoogle } from '@/lib/auth-actions'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    google?: any
  }
}

export function GoogleSignInButton({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!scriptLoaded || !window.google || !clientId || !ref.current) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        try {
          await loginWithGoogle(response.credential)
          toast.success('Signed in with Google')
          router.push('/')
          router.refresh()
        } catch (e: any) {
          toast.error(e?.message ?? 'Google sign-in failed')
        }
      },
    })

    // GSI accepts a width of 200-400px. Clamp the measured container width so
    // the rendered iframe can never exceed its parent (a key mobile overflow fix).
    const w = Math.min(Math.max(ref.current.offsetWidth || 320, 240), 400)
    window.google.accounts.id.renderButton(ref.current, {
      theme: 'outline',
      size: 'large',
      width: w,
      text: 'continue_with',
    })
  }, [scriptLoaded, clientId, router])

  if (!clientId) return null

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={ref} className="w-full min-w-0 max-w-full overflow-hidden flex justify-center min-h-[44px]" aria-label={label} />
    </>
  )
}
