import { memo } from 'react'

interface AvatarProps {
  uri?: string | null
  size?: number
  initials?: string
  className?: string
}

export const Avatar = memo(function Avatar({ uri, size = 40, initials, className = '' }: AvatarProps) {
  if (!uri) {
    const hue = initials ? (initials.charCodeAt(0) * 137.5) % 360 : 240
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: `hsl(${hue}, 55%, 45%)`, fontSize: size * 0.4 }}
      >
        {initials ?? '?'}
      </div>
    )
  }

  return (
    <img
      src={uri}
      alt={initials ?? 'Avatar'}
      loading="lazy"
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
})
