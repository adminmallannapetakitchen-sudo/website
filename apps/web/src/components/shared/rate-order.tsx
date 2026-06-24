'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { useLanguageStore } from '@/store/language-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** Post-delivery rating: 1-5 stars + optional comment. */
export function RateOrder({
  orderId,
  existingRating,
  existingComment,
  onRated,
}: {
  orderId: string
  existingRating?: number | null
  existingComment?: string | null
  onRated?: () => void
}) {
  const { language } = useLanguageStore()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(existingComment ?? '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(!!existingRating)

  const submit = async () => {
    if (rating < 1) return toast.error(language === 'te' ? 'రేటింగ్ ఎంచుకోండి' : 'Pick a rating')
    setBusy(true)
    try {
      await api.post(`/orders/${orderId}/rating`, { rating, comment: comment.trim() || undefined })
      setDone(true)
      onRated?.()
      toast.success(language === 'te' ? 'ధన్యవాదాలు!' : 'Thanks for your feedback!')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not submit rating')
    } finally {
      setBusy(false)
    }
  }

  const Stars = ({ interactive }: { interactive: boolean }) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => setRating(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn('transition-transform', interactive && 'active:scale-90 hover:scale-110')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              'w-7 h-7',
              (hover || rating) >= n ? 'fill-brand-gold text-brand-gold' : 'text-border',
            )}
          />
        </button>
      ))}
    </div>
  )

  if (done) {
    return (
      <div className="card p-5">
        <h3 className={cn('font-semibold text-foreground mb-2', language === 'te' ? 'font-telugu' : '')}>
          {language === 'te' ? 'మీ రేటింగ్‌కి ధన్యవాదాలు' : 'Thanks for rating this order'}
        </h3>
        <Stars interactive={false} />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className={cn('font-semibold text-foreground', language === 'te' ? 'font-telugu' : '')}>
        {language === 'te' ? 'మీ ఆర్డర్ ఎలా ఉంది?' : 'How was your order?'}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">
        {language === 'te' ? 'మీ అభిప్రాయం మాకు మెరుగుపడటానికి సహాయపడుతుంది' : 'Your feedback helps us cook better'}
      </p>
      <Stars interactive />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={language === 'te' ? 'ఏదైనా చెప్పాలనుకుంటున్నారా? (ఐచ్ఛికం)' : 'Anything to add? (optional)'}
        className={cn('mt-3 w-full input text-sm resize-none', language === 'te' ? 'font-telugu' : '')}
      />
      <Button onClick={submit} loading={busy} size="sm" className="mt-3">
        {language === 'te' ? 'సమర్పించండి' : 'Submit rating'}
      </Button>
    </div>
  )
}
