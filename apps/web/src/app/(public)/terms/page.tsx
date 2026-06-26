import type { Metadata } from 'next'
import { LegalPage } from '@/components/shared/legal-page'
import { kitchenInfo } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Terms of Service · Mallannapeta Kitchen',
  description: 'The terms that apply when you order from Mallannapeta Kitchen.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="26 June 2026">
      <p>
        These terms apply when you browse and order from Mallannapeta Kitchen. By placing an order,
        you agree to them.
      </p>

      <h2>Ordering</h2>
      <ul>
        <li>You must provide an accurate name, phone number and delivery address. Our kitchen calls you for every delivery, so a reachable phone number is required.</li>
        <li>An order is confirmed once you complete checkout (online payment) or place a Cash on Delivery order.</li>
        <li>We may decline or cancel an order if an item is unavailable, the delivery address is outside our service area, or details appear incorrect.</li>
      </ul>

      <h2>Pricing &amp; availability</h2>
      <p>
        Prices are shown on the menu and may change. Dishes are subject to availability and are
        prepared fresh, so some items may sell out. The total payable — including any delivery fee
        and discounts — is shown at checkout before you confirm.
      </p>

      <h2>Delivery</h2>
      <p>
        We deliver within our serviceable areas around Jagtial, Telangana. Serviceability is checked
        by pincode at checkout. Estimated delivery times are indicative and may vary with demand and
        weather.
      </p>

      <h2>Payment</h2>
      <p>
        You can pay online (UPI, cards, net-banking or wallets) through our secure payment partner
        Cashfree, or by Cash on Delivery where available. We never store your payment credentials.
      </p>

      <h2>Cancellations &amp; refunds</h2>
      <p>
        Cancellations and refunds are governed by our{' '}
        <a href="/refund">Refund &amp; Cancellation Policy</a>.
      </p>

      <h2>Food &amp; allergies</h2>
      <p>
        Our food is cooked in a home kitchen that handles common allergens (dairy, gluten, nuts and
        more). If you have a food allergy, please contact us before ordering. Veg/non-veg labels are
        provided for guidance.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Please don’t misuse the website, attempt to disrupt it, or place fraudulent orders. We may
        suspend accounts that do.
      </p>

      <h2>Liability</h2>
      <p>
        We work hard to serve fresh, quality food. To the extent permitted by law, our liability for
        any order is limited to the amount you paid for that order.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and any disputes are subject to the courts of
        Telangana.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${kitchenInfo.email}`}>{kitchenInfo.email}</a> or call{' '}
        <a href={`tel:${kitchenInfo.phone}`}>{kitchenInfo.phone}</a>.
      </p>
    </LegalPage>
  )
}
