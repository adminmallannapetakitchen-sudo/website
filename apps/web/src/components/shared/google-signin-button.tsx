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

    window.google.accounts.id.renderButton(ref.current, {
      theme: 'outline',
      size: 'large',
      width: ref.current.offsetWidth || 320,
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
      <div ref={ref} className="w-full flex justify-center min-h-[44px]" aria-label={label} />
    </>
  )
}
