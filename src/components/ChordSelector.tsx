import { NOTAS } from '../lib/transposer'

export function ChordSelector({ onSelect }: { onSelect: (nota: string) => void }) {
  return (
    <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NOTAS.map((nota) => (
        <button
          key={nota}
          type="button"
          onClick={() => onSelect(nota)}
          className="shrink-0 rounded-lg bg-zinc-700 px-3 py-2 text-base font-bold text-white hover:bg-zinc-600"
        >
          {nota}
        </button>
      ))}
    </div>
  )
}
