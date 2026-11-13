export function Logo({ size = 280, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`mb-6 flex animate-fade-in items-center justify-center ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}img/icon.png`}
        alt="Tiempo de Gracia"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
