export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
