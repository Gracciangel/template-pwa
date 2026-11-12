import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label?: string
  error?: string
  type?: 'text' | 'email' | 'password'
  onChange: (value: string) => void
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  autoFocus = false,
  className = '',
  ...props
}: InputProps) {
  const [secure, setSecure] = useState(type === 'password')

  return (
    <div className="mb-4">
      {label && <label className="mb-1 block font-semibold text-zinc-400">{label}</label>}
      <div
        className={`flex items-center rounded-xl border px-3 transition-colors focus-within:border-zinc-500 ${
          error ? 'border-red-500' : 'border-zinc-700'
        } ${disabled ? 'opacity-50' : ''} ${className}`}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          type={type === 'password' ? (secure ? 'password' : 'text') : type}
          autoCapitalize={type === 'email' ? 'none' : undefined}
          className="w-full flex-1 bg-transparent py-4 text-lg text-white outline-none placeholder:text-zinc-600"
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            aria-label={secure ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onClick={() => setSecure((s) => !s)}
            className="ml-2 text-zinc-500 hover:text-zinc-300"
          >
            {secure ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
