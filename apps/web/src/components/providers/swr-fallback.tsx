'use client'

import { SWRConfig } from 'swr'

/**
 * Seeds SWR's cache with server-fetched data so the client hooks (useMenu,
 * useKitchenSettings, useSundaySpecial…) render immediately with that data —
 * including in the server-rendered HTML — instead of fetching after hydration.
 */
export function SwrFallback({
  fallback,
  children,
}: {
  fallback: Record<string, unknown>
  children: React.ReactNode
}) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>
}
