// Server-side data fetching for the public pages. Runs on Vercel, cached at
// the edge via Next's `revalidate`, so the page HTML arrives WITH the data
// (fast first paint + SEO) instead of the browser fetching it after hydration.
// The shapes returned here are the raw API responses — they seed SWR's cache
// (see SwrFallback), and the client hooks normalize them exactly as before.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

async function serverGet<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    // Self-catching fetch (resolves null on error) so a rejection can never
    // dangle when the timeout wins the race — that would surface as an
    // unhandledRejection. Cap the wait so a slow/cold/down API can never block
    // the render; we fall back to client-side SWR fetching instead.
    const safeFetch = fetch(`${API_URL}${path}`, { next: { revalidate } }).catch(() => null)
    const res = await Promise.race([
      safeFetch,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ])
    if (!res || !res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export const getMenuItems = () => serverGet<any[]>('/menu/items', 120)
export const getCategories = () => serverGet<any[]>('/categories', 300)
export const getSundaySpecial = () => serverGet<any>('/sunday-special/current', 120)
export const getKitchenSettings = () => serverGet<any>('/kitchen-settings/public', 30)

/** Build an SWR fallback map from server-fetched data (only includes hits). */
export async function getPublicFallback(): Promise<Record<string, any>> {
  const [menu, categories, sunday, settings] = await Promise.all([
    getMenuItems(),
    getCategories(),
    getSundaySpecial(),
    getKitchenSettings(),
  ])
  const fallback: Record<string, any> = {}
  if (menu) fallback['/menu/items'] = menu
  if (categories) fallback['/categories'] = categories
  if (sunday) fallback['/sunday-special/current'] = sunday
  if (settings) fallback['/kitchen-settings/public'] = settings
  return fallback
}
