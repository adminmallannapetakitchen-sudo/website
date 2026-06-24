'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Catches React rendering errors at the root and reports them to Sentry
// (no-op when no DSN is configured). Replaces the whole document, so styles
// are inline.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#FFFAF0', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
          }}
        >
          <h2 style={{ color: '#B8332A', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b6b6b', marginBottom: '1.5rem' }}>
            We hit an unexpected error. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#B8332A',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
