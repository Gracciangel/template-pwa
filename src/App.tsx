import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { HomePage } from './pages/Home'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { ProfilePage } from './pages/Profile'
import { SocialPage } from './pages/Social'
import { NotificacionesPage } from './pages/Notificaciones'
import { AuthCallbackPage } from './pages/AuthCallback'
import { NotFoundPage } from './pages/NotFound'
import { PlaceholderPage } from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="bible" element={<PlaceholderPage title="Biblia" />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="user" element={<Navigate to="/login" replace />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />

        <Route path="audios" element={<PlaceholderPage title="Audios" />} />
        <Route path="musica" element={<PlaceholderPage title="Música" />} />
        <Route path="video" element={<PlaceholderPage title="Videos" />} />
        <Route path="notes" element={<PlaceholderPage title="Mis notas" />} />
        <Route path="groups" element={<PlaceholderPage title="Grupos" />} />
        <Route path="grupo/:id" element={<PlaceholderPage title="Grupo" />} />
        <Route path="ministerios" element={<PlaceholderPage title="Ministerios" />} />
        <Route path="ministerio/:id" element={<PlaceholderPage title="Ministerio" />} />
        <Route path="ministerio/cronograma" element={<PlaceholderPage title="Cronograma" />} />
        <Route path="ministerio/danza-mapa" element={<PlaceholderPage title="Mapa de danza" />} />
        <Route path="events-register" element={<PlaceholderPage title="Mis eventos" />} />
        <Route path="evento/:id" element={<PlaceholderPage title="Evento" />} />
        <Route path="canciones" element={<PlaceholderPage title="Canciones" />} />
        <Route path="cancion/:id" element={<PlaceholderPage title="Canción" />} />
        <Route path="admin/canciones" element={<PlaceholderPage title="Administrar canciones" />} />
        <Route path="admin/cancion-form" element={<PlaceholderPage title="Editar canción" />} />

        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
