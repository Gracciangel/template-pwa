/* Handlers de Web Push para el service worker (inyectado por vite-plugin-pwa). */

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
  var options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    tag: data.tipo || 'tdg',
    renotify: true,
    data: { url: destinoNotificacion(data), datos: data.datos || {} },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var url = (event.notification.data && event.notification.data.url) || '/notificaciones'

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
