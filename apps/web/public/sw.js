/* Mallannapeta Kitchen — Web Push service worker */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'Mallannapeta Kitchen', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Mallannapeta Kitchen'
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: data.tag,
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && 'focus' in w) return w.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    }),
  )
})
