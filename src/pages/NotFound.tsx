import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-zinc-800">404</p>
      <h1 className="text-xl font-bold text-white">No encontramos esta pantalla</h1>
      <Link to="/">
        <Button variant="purple">Volver al inicio</Button>
      </Link>
    </div>
  )
}
