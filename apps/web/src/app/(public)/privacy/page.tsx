import type { Metadata } from 'next'
import { LegalPage } from '@/components/shared/legal-page'
import { kitchenInfo } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Privacy Policy · Mallannapeta Kitchen',
  description: 'How Mallannapeta Kitchen collects, uses and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="26 June 2026">
      <p>
        Mallannapeta Kitchen (“we”, “us”, “our”) respects your privacy. This policy explains what
        information we collect when you use our website to order food, why we collect it, and how we
        keep it safe.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your name, phone number and email address.</li>
        <li><strong>Delivery details</strong> — the delivery address and any landmark or instructions you provide.</li>
        <li><strong>Order information</strong> — items ordered, order history and any notes.</li>
        <li><strong>Technical data</strong> — basic device/browser information and your in-browser cart, kept on your device so your cart isn’t lost.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To prepare, confirm and deliver your orders.</li>
        <li>To contact you about your order (our kitchen calls you for every delivery).</li>
        <li>To send order updates and, if you opt in, notifications.</li>
        <li>To improve our menu and service.</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Online payments are processed securely by our payment partner, <strong>Cashfree Payments</strong>.
        We do <strong>not</strong> see or store your card, UPI or bank details — those are handled
        entirely by the payment gateway. For Cash on Delivery orders, you pay our delivery person
        directly.
      </p>

      <h2>Sharing your information</h2>
      <p>
        We do not sell your personal information. We share it only as needed to run the service — for
        example, with our payment gateway to process a payment, or with our delivery staff to deliver
        your order. We may disclose information if required by law.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your account and order information for as long as your account is active or as needed
        to provide the service and meet legal/accounting requirements.
      </p>

      <h2>Your choices</h2>
      <p>
        You can view and update your name, email, phone and addresses from your account at any time.
        To delete your account or request removal of your data, contact us using the details below.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy? Reach us at{' '}
        <a href={`mailto:${kitchenInfo.email}`}>{kitchenInfo.email}</a> or{' '}
        <a href={`tel:${kitchenInfo.phone}`}>{kitchenInfo.phone}</a>. Mallannapeta Kitchen, Jagtial,
        Telangana, India.
      </p>
    </LegalPage>
  )
}
