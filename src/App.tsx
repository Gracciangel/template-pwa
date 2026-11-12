import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { HomePage } from './pages/Home'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { ProfilePage } from './pages/Profile'
import { SocialPage } from './pages/Social'
import { NotificacionesPage } from './pages/Notificaciones'
import { BiblePage } from './pages/Bible'
import { AuthCallbackPage } from './pages/AuthCallback'
import { NotFoundPage } from './pages/NotFound'
import { AudiosPage, MusicaPage } from './pages/Audios'
import { VideoPage } from './pages/Video'
import { NotesPage } from './pages/Notes'
import { GroupsPage } from './pages/Groups'
import { GrupoDetallePage } from './pages/GrupoDetalle'
import { MinisteriosPage } from './pages/Ministerios'
import { MinisterioDetallePage } from './pages/MinisterioDetalle'
import { CronogramaPage } from './pages/Cronograma'
import { DanzaMapaPage } from './pages/DanzaMapa'
import { EventsRegisterPage } from './pages/EventsRegister'
import { EventoDetallePage } from './pages/EventoDetalle'
import { CancionesPage } from './pages/Canciones'
import { CancionDetallePage } from './pages/CancionDetalle'
import { AdminCancionesPage } from './pages/AdminCanciones'
import { AdminCancionFormPage } from './pages/AdminCancionForm'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="bible" element={<BiblePage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="user" element={<Navigate to="/login" replace />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />

        <Route path="audios" element={<AudiosPage />} />
        <Route path="musica" element={<MusicaPage />} />
        <Route path="video" element={<VideoPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="grupo/:id" element={<GrupoDetallePage />} />
        <Route path="ministerios" element={<MinisteriosPage />} />
        <Route path="ministerio/:id" element={<MinisterioDetallePage />} />
        <Route path="ministerio/cronograma" element={<CronogramaPage />} />
        <Route path="ministerio/danza-mapa" element={<DanzaMapaPage />} />
        <Route path="events-register" element={<EventsRegisterPage />} />
        <Route path="evento/:id" element={<EventoDetallePage />} />
        <Route path="canciones" element={<CancionesPage />} />
        <Route path="cancion/:id" element={<CancionDetallePage />} />
        <Route path="admin/canciones" element={<AdminCancionesPage />} />
        <Route path="admin/cancion-form" element={<AdminCancionFormPage />} />

        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
