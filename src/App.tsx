import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './App.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}

function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setPromptEvent(null)
  }

  return { canInstall: promptEvent !== null, installed, install }
}

function App() {
  const online = useOnlineStatus()
  const { canInstall, installed, install } = useInstallPrompt()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Revisa si hay una nueva versión cada hora.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('Error al registrar el service worker:', error)
    },
  })

  return (
    <main className="app">
      <header className="hero">
        <span className="badge">
          <span className={online ? 'dot dot--online' : 'dot dot--offline'} />
          {online ? 'En línea' : 'Sin conexión'}
        </span>
        <h1>Mi PWA</h1>
        <p className="lead">
          Base instalable lista para crecer: manifest, service worker y
          funcionamiento sin conexión.
        </p>
        <div className="actions">
          {installed ? (
            <span className="chip chip--ok">✓ Instalada</span>
          ) : canInstall ? (
            <button type="button" className="button" onClick={install}>
              Instalar aplicación
            </button>
          ) : (
            <span className="hint">
              Usa el menú del navegador → «Instalar aplicación» para añadirla.
            </span>
          )}
        </div>
      </header>

      <section className="status" aria-label="Estado de la aplicación">
        <article className="card">
          <h2>Service worker</h2>
          <p>
            {offlineReady
              ? 'Listo para funcionar sin conexión.'
              : 'Se activa tras la primera visita en producción.'}
          </p>
        </article>
        <article className="card">
          <h2>Modo de ejecución</h2>
          <p>{installed ? 'Aplicación instalada (standalone).' : 'Pestaña del navegador.'}</p>
        </article>
        <article className="card">
          <h2>Siguiente paso</h2>
          <p>
            Edita <code>src/App.tsx</code> y guarda para ver los cambios al
            instante.
          </p>
        </article>
      </section>

      {needRefresh && (
        <div className="toast" role="status">
          <span>Hay una nueva versión disponible.</span>
          <div className="toast__actions">
            <button type="button" className="button button--small" onClick={() => updateServiceWorker(true)}>
              Actualizar
            </button>
            <button type="button" className="link" onClick={() => setNeedRefresh(false)}>
              Más tarde
            </button>
          </div>
        </div>
      )}

      {offlineReady && !needRefresh && (
        <div className="toast" role="status">
          <span>La app ya funciona sin conexión.</span>
          <button type="button" className="link" onClick={() => setOfflineReady(false)}>
            Cerrar
          </button>
        </div>
      )}
    </main>
  )
}

export default App
