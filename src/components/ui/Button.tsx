import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'success' | 'cancel' | 'primary' | 'purple' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  variant?: Variant
  loading?: boolean
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  success: 'bg-green-800 hover:bg-green-700',
  cancel: 'bg-red-500 hover:bg-red-400',
  primary: 'bg-blue-500 hover:bg-blue-400',
  purple: 'bg-purple-600 hover:bg-purple-500',
  ghost: 'bg-zinc-800 hover:bg-zinc-700',
}

export function Button({
  label,
  variant = 'success',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner size={18} />}
      {children ?? label}
    </button>
  )
}
