/* Handlers de Web Push para el service worker (inyectado por vite-plugin-pwa). */

// El SW puede vivir en una subruta (por ej. /template-pwa/), así que las URLs
// de las notificaciones se resuelven contra el scope de la app.
function urlEnScope(ruta) {
  var scope = self.registration.scope
  if (!ruta) return scope
  return new URL(String(ruta).replace(/^\/+/, ''), scope).href
}

function destinoNotificacion(data) {
  if (data && typeof data.url === 'string' && data.url) return data.url
  var screen = data && typeof data.datos?.screen === 'string' ? data.datos.screen : ''
  if (screen.indexOf('profile') !== -1) return '/profile'
  if (screen.indexOf('home') !== -1) return '/'
  if (screen.indexOf('event') !== -1) return '/events-register'
  if (screen.indexOf('ministerio') !== -1) return '/ministerios'
  if (screen.indexOf('grupo') !== -1) return '/groups'
  return '/notificaciones'
}

self.addEventListener('push', function (event) {
  var data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { body: event.data.text() }
    }
  }

  var title = data.title || 'Tiempo de Gracia'
  var icono = urlEnScope('icons/icon-192.png')
  var options = {
    body: data.body || '',
    icon: data.icon ? urlEnScope(data.icon) : icono,
    badge: data.badge ? urlEnScope(data.badge) : icono,
    tag: data.tipo || 'tdg',
    renotify: true,
    data: { url: urlEnScope(destinoNotificacion(data)), datos: data.datos || {} },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var url =
    (event.notification.data && event.notification.data.url) ||
    urlEnScope('/notificaciones')

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
