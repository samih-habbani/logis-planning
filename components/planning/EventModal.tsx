'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { PlanningEvent, EventFormData, Trainer, Center } from '@/types/planning'
import { CENTER_LABELS, DAYS_FR, MONTHS_FR, H_START, H_END } from '@/types/planning'

interface Props {
  open: boolean
  date: Date | null
  initialStart?: string
  event?: PlanningEvent | null
  onClose: () => void
  onSave: (data: EventFormData) => Promise<void>
  onDelete?: () => Promise<void>
}

function buildTimeOptions() {
  const opts: string[] = []
  for (let h = H_START; h <= H_END; h++) {
    for (const m of [0, 30]) {
      if (h === H_END && m === 30) break
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}

const TIME_OPTIONS = buildTimeOptions()

const TRAINER_CFG = {
  ali:   { label: 'Ali',   sel: 'ring-sky-500 bg-sky-500/10 text-sky-300' },
  samih: { label: 'Samih', sel: 'ring-violet-500 bg-violet-500/10 text-violet-300' },
}
const CENTER_CFG = {
  city_mall: { sel: 'ring-amber-500 bg-amber-500/10 text-amber-300' },
  oasis:     { sel: 'ring-emerald-500 bg-emerald-500/10 text-emerald-300' },
  mirdif:    { sel: 'ring-rose-500 bg-rose-500/10 text-rose-300' },
}

export function EventModal({ open, date, initialStart, event, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<EventFormData>({
    trainer: null, center: null,
    start_time: `${String(H_START).padStart(2, '0')}:00`,
    end_time: `${String(H_START + 1).padStart(2, '0')}:00`,
    curriculum: '', student_name: '', note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    if (event) {
      setForm({
        trainer: event.trainer,
        center: event.center,
        start_time: event.start_time.slice(0, 5),
        end_time: event.end_time.slice(0, 5),
        curriculum: event.curriculum ?? '',
        student_name: event.student_name ?? '',
        note: event.note ?? '',
      })
    } else {
      const start = initialStart ?? `${String(H_START).padStart(2, '0')}:00`
      const [h, m] = start.split(':').map(Number)
      const endMin = h * 60 + m + 60
      const endH = Math.min(Math.floor(endMin / 60), H_END)
      const endM = endMin % 60
      setForm({
        trainer: null, center: null, start_time: start,
        end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        curriculum: '', student_name: '', note: '',
      })
    }
    setError(null)
    setTimeout(() => firstBtnRef.current?.focus(), 80)
  }, [open, event, initialStart])

  function set<K extends keyof EventFormData>(k: K, v: EventFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.trainer) { setError('Sélectionnez un formateur.'); return }
    if (!form.center) { setError('Sélectionnez un centre.'); return }
    if (form.end_time <= form.start_time) { setError("L'heure de fin doit être après le début."); return }
    setSaving(true); setError(null)
    try { await onSave(form) } catch { setError('Erreur lors de l\'enregistrement.') } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!onDelete || !confirm('Supprimer ce cours ?')) return
    try { await onDelete() } catch { setError('Erreur lors de la suppression.') }
  }

  const dateLabel = date ? `${DAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}` : ''

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:max-w-md bg-neutral-900 border border-neutral-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Mobile handle */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden" onClick={onClose}>
          <div className="w-8 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-white">{event ? 'Modifier le cours' : 'Nouveau cours'}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* Trainer */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Formateur</p>
            <div className="grid grid-cols-2 gap-2">
              {(['ali', 'samih'] as Trainer[]).map((t, i) => (
                <button key={t} ref={i === 0 ? firstBtnRef : undefined} onClick={() => set('trainer', t)}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ring-1 ${
                    form.trainer === t ? TRAINER_CFG[t].sel : 'ring-neutral-700 text-neutral-400 hover:ring-neutral-500 hover:text-white'
                  }`}>
                  {TRAINER_CFG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Center */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Centre</p>
            <div className="flex gap-2 flex-wrap">
              {(['city_mall', 'oasis', 'mirdif'] as Center[]).map(c => (
                <button key={c} onClick={() => set('center', c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ring-1 ${
                    form.center === c ? CENTER_CFG[c].sel : 'ring-neutral-700 text-neutral-400 hover:ring-neutral-500 hover:text-white'
                  }`}>
                  {CENTER_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Horaire</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <select value={form.start_time} onChange={e => set('start_time', e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-neutral-600 text-center">–</span>
              <select value={form.end_time} onChange={e => set('end_time', e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500">
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Curriculum */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">N° Curriculum</p>
            <input type="text" value={form.curriculum} onChange={e => set('curriculum', e.target.value)}
              placeholder="ex: SC-301"
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
          </div>

          {/* Student */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Nom de l'élève</p>
            <input type="text" value={form.student_name} onChange={e => set('student_name', e.target.value)}
              placeholder="Prénom Nom"
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Note (optionnel)</p>
            <textarea value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="Remarques, matériel, informations..." rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 resize-none" />
          </div>

          {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 flex items-center gap-2">
          {event && onDelete && (
            <button onClick={handleDelete} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors" aria-label="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50">
            {saving ? 'Enregistrement...' : event ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
