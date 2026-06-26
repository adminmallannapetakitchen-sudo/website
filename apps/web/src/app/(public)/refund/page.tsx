import type { Metadata } from 'next'
import { LegalPage } from '@/components/shared/legal-page'
import { kitchenInfo } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy · Mallannapeta Kitchen',
  description: 'How cancellations and refunds work at Mallannapeta Kitchen.',
}

export default function RefundPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="26 June 2026">
      <p>
        Because our food is freshly cooked to order, please read how cancellations and refunds work.
      </p>

      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel <strong>before we start preparing</strong> your order (while it is still “Confirmed”). Call or message us as soon as possible.</li>
        <li>Once an order is being prepared or is out for delivery, it can no longer be cancelled, as the food has already been made.</li>
      </ul>

      <h2>Refunds for prepaid (online) orders</h2>
      <ul>
        <li>If you cancel in time, or if we cancel your order (for example, an item is unavailable or your area is unservable), we refund the full amount.</li>
        <li>Refunds are made to your original payment method through our payment partner Cashfree, and typically reach your account within <strong>5–7 business days</strong>, depending on your bank.</li>
      </ul>

      <h2>Cash on Delivery</h2>
      <p>
        For Cash on Delivery orders there is no upfront payment, so there is nothing to refund on a
        cancellation. You simply don’t pay for a cancelled order.
      </p>

      <h2>Problems with your order</h2>
      <p>
        If something is wrong — an item is missing, incorrect, or the food quality isn’t right —
        please contact us <strong>within 2 hours of delivery</strong> with your order number and a
        photo if possible. We’ll make it right with a replacement or a refund, decided case by case.
      </p>

      <h2>Not eligible for refund</h2>
      <ul>
        <li>Orders reported after a long delay where quality can no longer be verified.</li>
        <li>Change-of-mind once the food has been prepared or delivered.</li>
        <li>Incorrect delivery address or an unreachable phone number provided by the customer.</li>
      </ul>

      <h2>Contact us</h2>
      <p>
        To cancel an order or request a refund, reach us at{' '}
        <a href={`tel:${kitchenInfo.phone}`}>{kitchenInfo.phone}</a> or{' '}
        <a href={`mailto:${kitchenInfo.email}`}>{kitchenInfo.email}</a>. We’re here{' '}
        {kitchenInfo.openingHours}.
      </p>
    </LegalPage>
  )
}
