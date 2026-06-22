'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { COLOR_MAP, COLOR_PALETTE } from '@/types/planning'

interface Props {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

export function AddTrainerModal({ open, onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('sky')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Please enter a name.'); return }
    setSaving(true); setError(null)
    const res = await fetch('/api/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to add trainer.')
      return
    }
    setName(''); setColor('sky')
    onAdded()
    onClose()
  }

  function handleClose() {
    setName(''); setColor('sky'); setError(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-base font-semibold text-white">Add trainer</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Name</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Karim"
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
            />
          </div>

          {/* Color */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${COLOR_MAP[c].dot} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                  title={c}
                />
              ))}
            </div>
            {/* Preview */}
            <div className={`mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${COLOR_MAP[color].selRing.replace('ring-', 'border-').split(' ')[0]} ${COLOR_MAP[color].card}`}>
              <span className={`${COLOR_MAP[color].nameText} font-bold uppercase tracking-wide text-[10px]`}>
                {name || 'Preview'}
              </span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50">
            {saving ? 'Adding...' : 'Add trainer'}
          </button>
        </div>
      </div>
    </div>
  )
}
