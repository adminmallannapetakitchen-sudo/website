import type { ReactNode } from 'react'

/**
 * Shared shell for the static legal/info pages (privacy, terms, refund,
 * contact). Child-selector classes give clean prose styling without pulling in
 * the typography plugin.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div className="section py-12 md:py-16">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">{title}</h1>
        {updated && (
          <p className="text-sm text-muted-foreground mt-2">Last updated: {updated}</p>
        )}
        <div
          className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground
                     [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-9 [&_h2]:mb-2
                     [&_p]:leading-relaxed
                     [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
                     [&_a]:text-brand-red [&_a]:font-medium [&_a]:underline-offset-2 [&_a:hover]:underline
                     [&_strong]:text-foreground [&_strong]:font-semibold"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
